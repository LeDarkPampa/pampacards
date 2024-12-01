import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import {ApiService} from "./api.service";
import {Partie} from "../classes/parties/Partie";
import {EvenementPartie} from "../classes/parties/EvenementPartie";
import {PlayerState} from "../classes/parties/PlayerState";
import {PartieDatas} from "../classes/parties/PartieDatas";

@Injectable({
  providedIn: 'root'
})
export class PartieEventService extends ApiService {

  constructor(private http: HttpClient) {
    super();
  }

  getPartie(partieId: number): Observable<Partie> {
    return this.http.get<Partie>(this.API_URL + '/partie?partieId=' + partieId);
  }

  getEventsPartie(partieId: number): Observable<EvenementPartie[]> {
    return this.http.get<EvenementPartie[]>(this.API_URL + `/partieEvents?partieId=${partieId}`);
  }

  sendEvent(event: any) {
    this.http.post<any>(this.API_URL + '/partieEvent', event).subscribe({
      next: response => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  sendAbandonResult(joueur: PlayerState, adversaire: PlayerState, partie: Partie) {
    let event = this.createAbandonResult(joueur, adversaire, partie);

    this.http.post<any>(this.API_URL + '/enregistrerResultat', event).subscribe({
      next: response => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });

  }

  createAbandonResult(joueur: PlayerState, adversaire: PlayerState, partie: Partie) {
    let scoreJ1 = joueur.id == partie.joueurUn.id ? joueur.score : adversaire.score;
    let scoreJ2 = joueur.id == partie.joueurDeux.id ? joueur.score : adversaire.score;

    let event: {
      partie: Partie;
      vainqueurId: number;
      scoreJ1: number;
      scoreJ2: number;
    };

    event = {
      partie: partie,
      vainqueurId: adversaire.id,
      scoreJ1: scoreJ1,
      scoreJ2: scoreJ2
    };

    return event;
  }

  enregistrerResultatFinPartie(event: any): Observable<any> {
    return this.http.post<any>(this.API_URL + '/enregistrerResultat', event);
  }

  createEndTurnEvent(partie: Partie, userId: number, joueur: PlayerState, adversaire: PlayerState, lastEvent: EvenementPartie) {
    const cardStates = this.getCardStates(partie, userId, joueur, adversaire);
    return {
      partie: partie,
      tour: lastEvent.tour,
      joueurActifId: lastEvent.joueurActifId,
      premierJoueurId: lastEvent.premierJoueurId,
      status: "TOUR_TERMINE",
      ...cardStates,
      stopJ1: lastEvent.stopJ1,
      stopJ2: lastEvent.stopJ2
    };
  }

  sendUpdatedGame(partie: Partie, userId: number, joueur: PlayerState, adversaire: PlayerState, lastEvent: EvenementPartie, stopJ1 = false, stopJ2 = false) {
    let event = this.createNextEvent(stopJ1, stopJ2, partie, userId, joueur, adversaire, lastEvent);
    this.sendEvent(event);
  }

  sendUpdatedGameAfterPlay(partie: Partie, userId: number, joueur: PlayerState, adversaire: PlayerState, lastEvent: EvenementPartie, stopJ1 = false, stopJ2 = false) {
    let event = this.createNextEvent(stopJ1, stopJ2, partie, userId, joueur, adversaire, lastEvent);
    event.carteJouee = true;
    this.sendEvent(event);
  }

  sendUpdatedGameAfterDefausse(partie: Partie, userId: number, joueur: PlayerState, adversaire: PlayerState, lastEvent: EvenementPartie, stopJ1 = false, stopJ2 = false) {   let event = this.createNextEvent(stopJ1, stopJ2, partie, userId, joueur, adversaire, lastEvent);
    event.carteDefaussee = true;
    this.sendEvent(event);
  }

  private createNextEvent(stopJ1 = false, stopJ2 = false, partie: Partie, userId: number, joueur: PlayerState, adversaire: PlayerState, lastEvent: EvenementPartie){
  const cardStates = this.getCardStates(partie, userId, joueur, adversaire);
    return {
      partie: partie,
      tour: lastEvent.tour,
      joueurActifId: lastEvent.joueurActifId,
      premierJoueurId: lastEvent.premierJoueurId,
      status: "TOUR_EN_COURS",
      ...cardStates,
      stopJ1: stopJ1 || lastEvent.stopJ1,
      stopJ2: stopJ2 || lastEvent.stopJ2,
      carteJouee: lastEvent.carteJouee,
      carteDefaussee: lastEvent.carteDefaussee
    };
  }

  createEndEvent(vainqueurId: number, partie: Partie, joueur: PlayerState, adversaire: PlayerState) {
    let scoreJ1 = joueur.id == partie.joueurUn.id ? joueur.score : adversaire.score;
    let scoreJ2 = joueur.id == partie.joueurDeux.id ? joueur.score : adversaire.score;

    return {
      partie: partie,
      vainqueurId: vainqueurId,
      scoreJ1: scoreJ1,
      scoreJ2: scoreJ2
    };
  }

  sendAbandonEvent(event: {
    cartesDefausseJoueurUn: string;
    partie: Partie;
    cartesDeckJoueurDeux: string;
    cartesMainJoueurUn: string;
    cartesDeckJoueurUn: string;
    cartesTerrainJoueurUn: string;
    tour: number;
    cartesDefausseJoueurDeux: string;
    joueurActifId: number;
    premierJoueurId: number;
    cartesTerrainJoueurDeux: string;
    cartesMainJoueurDeux: string;
    stopJ1: boolean;
    stopJ2: boolean;
    status: string
  }, partieDatas: PartieDatas, partie: Partie) {
    this.http.post<any>(this.API_URL + '/partieEvent', event).subscribe({
      next: response => {
        partieDatas.finDePartie = true;
        partieDatas.nomJoueurAbandon = partieDatas.joueur.nom;
        partieDatas.nomVainqueur = partieDatas.adversaire.nom;

        this.sendAbandonResult(partieDatas.joueur, partieDatas.adversaire, partie);
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  createAbandonEvent(partie: Partie, userId: number, joueur: PlayerState, adversaire: PlayerState, lastEvent: EvenementPartie) {
    const cardStates = this.getCardStates(partie, userId, joueur, adversaire);
    return {
      partie: partie,
      tour: lastEvent.tour,
      joueurActifId: lastEvent.joueurActifId,
      premierJoueurId: lastEvent.premierJoueurId,
      status: "ABANDON",
      ...cardStates,
      stopJ1: lastEvent.stopJ1,
      stopJ2: lastEvent.stopJ2
    };
  }

  getCardStates(partie: Partie, userId: number, joueur: PlayerState, adversaire: PlayerState) {
    return {
      cartesMainJoueurUn: JSON.stringify(partie.joueurUn.id == userId ? joueur.main : adversaire.main),
      cartesMainJoueurDeux: JSON.stringify(partie.joueurDeux.id == userId ? joueur.main : adversaire.main),
      cartesTerrainJoueurUn: JSON.stringify(partie.joueurUn.id == userId ? joueur.terrain : adversaire.terrain),
      cartesTerrainJoueurDeux: JSON.stringify(partie.joueurDeux.id == userId ? joueur.terrain : adversaire.terrain),
      cartesDeckJoueurUn: JSON.stringify(partie.joueurUn.id == userId ? joueur.deck : adversaire.deck),
      cartesDeckJoueurDeux: JSON.stringify(partie.joueurDeux.id == userId ? joueur.deck : adversaire.deck),
      cartesDefausseJoueurUn: JSON.stringify(partie.joueurUn.id == userId ? joueur.defausse : adversaire.defausse),
      cartesDefausseJoueurDeux: JSON.stringify(partie.joueurDeux.id == userId ? joueur.defausse : adversaire.defausse)
    };
  }
}
