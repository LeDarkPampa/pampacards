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
}
