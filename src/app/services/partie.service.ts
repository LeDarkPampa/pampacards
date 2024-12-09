import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import {AuthentificationService} from "./authentification.service";
import {Clan} from "../classes/cartes/Clan";
import {Type} from "../classes/cartes/Type";
import {PlayerState} from "../classes/parties/PlayerState";
import {CartePartie} from "../classes/cartes/CartePartie";
import {PartieDatas} from "../classes/parties/PartieDatas";
import {CarteService} from "./carte.service";

@Injectable({
  providedIn: 'root'
})
export class PartieService {

  constructor(private http: HttpClient, private authService: AuthentificationService, private carteService: CarteService) { }

  nomCorrompu = 'Corrompu';

  clanCorrompu: Clan = {
    id: 0,
    nom: this.nomCorrompu
  };

  typeCorrompu: Type = {
    id: 0,
    nom: this.nomCorrompu
  };

  poissonPourri: CartePartie = {
    id: 0,
    cartePartieId: 0,
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


  getPoissonPourri(): CartePartie {
    return this.poissonPourri;
  }

  getClanCorrompu(): Clan {
    return this.clanCorrompu;
  }

  getTypeCorrompu(): Type {
    return this.typeCorrompu;
  }

  melangerDeck(deck: CartePartie[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  initPlayerCards = (player: PlayerState) => {
    const initCardProperties = (carte: CartePartie) => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    };
    player.deck.forEach(initCardProperties);
    player.main.forEach(initCardProperties);
  };

  updateScores(partieDatas: PartieDatas) {
    let sommePuissancesJoueur = 0;
    let sommePuissancesAdversaire = 0;

    for (let carte of partieDatas.joueur.terrain) {
      sommePuissancesJoueur += this.carteService.getPuissanceTotale(carte);
    }

    for (let carte of partieDatas.adversaire.terrain) {
      sommePuissancesAdversaire += this.carteService.getPuissanceTotale(carte);
    }

    partieDatas.joueur.score = sommePuissancesJoueur;
    partieDatas.adversaire.score = sommePuissancesAdversaire;
  }
}
