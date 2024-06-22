import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import {AuthentificationService} from "./authentification.service";
import {ICarte} from "../interfaces/ICarte";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {IPlayerState} from "../interfaces/IPlayerState";
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";
import {IPartie} from "../interfaces/IPartie";

@Injectable({
  providedIn: 'root'
})
export class PartieService {

  constructor(private http: HttpClient, private authService: AuthentificationService) { }

  nomCorrompu = 'Corrompu';

  clanCorrompu: IClan = {
    id: 0,
    nom: this.nomCorrompu
  };

  typeCorrompu: IType = {
    id: 0,
    nom: this.nomCorrompu
  };

  poissonPourri: ICarte = {
    id: 0,
    nom: 'Poisson pourri',
    clan: {
      id: -1,
      nom: 'Mafia'
    },
    type: {
      id: -1,
      nom: 'Eau'
    },
    rarete: 0,
    effet: {
      id: 79,
      code: 'NO',
      continu: false,
      conditionPuissanceAdverse: 0,
      valeurBonusMalus: 0,
      description: 'Aucun effet'
    },
    puissance: -1,
    image_path: 'poissonpourri.png',
    silence: false,
    bouclier: false,
    insensible: false,
    prison: false,
    diffPuissanceInstant: 0,
    diffPuissanceContinue: 0,
    released: false
  };


  getPoissonPourri(): ICarte {
    return this.poissonPourri;
  }

  getClanCorrompu(): IClan {
    return this.clanCorrompu;
  }

  getTypeCorrompu(): IType {
    return this.typeCorrompu;
  }

  melangerDeck(deck: ICarte[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  initPlayerCards = (player: IPlayerState) => {
    const initCardProperties = (carte: ICarte) => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    };
    player.deck.forEach(initCardProperties);
    player.main.forEach(initCardProperties);
  };

  getPartie(partieId: number): Observable<IPartie> {
    return this.http.get<IPartie>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partie?partieId=' + partieId);
  }

  getEventsPartie(partieId: number): Observable<IEvenementPartie[]> {
    return this.http.get<IEvenementPartie[]>(`https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvents?partieId=${partieId}`);
  }

  sendEvent(event: any) {
    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
      next: response => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  sendAbandonResult(joueur: IPlayerState, adversaire: IPlayerState, partie: IPartie) {
    let event = this.createAbandonResult(joueur, adversaire, partie);

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/enregistrerResultat', event).subscribe({
      next: response => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });

  }

  createAbandonResult(joueur: IPlayerState, adversaire: IPlayerState, partie: IPartie) {
    let scoreJ1 = joueur.id == partie.joueurUn.id ? joueur.score : adversaire.score;
    let scoreJ2 = joueur.id == partie.joueurDeux.id ? joueur.score : adversaire.score;

    let event: {
      partie: IPartie;
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
    return this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/enregistrerResultat', event);
  }

  createEndTurnEvent(partie: IPartie, userId: number, joueur: IPlayerState, adversaire: IPlayerState, lastEvent: IEvenementPartie) {
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

  sendUpdatedGameAfterPlay(partie: IPartie, userId: number, joueur: IPlayerState, adversaire: IPlayerState, lastEvent: IEvenementPartie, stopJ1 = false, stopJ2 = false) {
    let event = this.createNextEvent(stopJ1, stopJ2, partie, userId, joueur, adversaire, lastEvent);
    event.carteJouee = true;
    this.sendEvent(event);
  }

  sendUpdatedGameAfterDefausse(partie: IPartie, userId: number, joueur: IPlayerState, adversaire: IPlayerState, lastEvent: IEvenementPartie, stopJ1 = false, stopJ2 = false) {
    let event = this.createNextEvent(stopJ1, stopJ2, partie, userId, joueur, adversaire, lastEvent);
    event.carteDefaussee = true;
    this.sendEvent(event);
  }

  private createNextEvent(stopJ1 = false, stopJ2 = false, partie: IPartie, userId: number, joueur: IPlayerState, adversaire: IPlayerState, lastEvent: IEvenementPartie){
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

  createEndEvent(vainqueurId: number, partie: IPartie, joueur: IPlayerState, adversaire: IPlayerState) {
    let scoreJ1 = joueur.id == partie.joueurUn.id ? joueur.score : adversaire.score;
    let scoreJ2 = joueur.id == partie.joueurDeux.id ? joueur.score : adversaire.score;

    return {
      partie: partie,
      vainqueurId: vainqueurId,
      scoreJ1: scoreJ1,
      scoreJ2: scoreJ2
    };
  }

  createAbandonEvent(partie: IPartie, userId: number, joueur: IPlayerState, adversaire: IPlayerState, lastEvent: IEvenementPartie) {
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

  getCardStates(partie: IPartie, userId: number, joueur: IPlayerState, adversaire: IPlayerState) {
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
