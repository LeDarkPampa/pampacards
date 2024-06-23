import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "./authentification.service";
import {ICarte} from "../interfaces/ICarte";
import {IPlayerState} from "../interfaces/IPlayerState";
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";
import {CarteService} from "./carte.service";

@Injectable({
  providedIn: 'root'
})
export class PartieService {

  constructor(private http: HttpClient, private authService: AuthentificationService, private carteService: CarteService) { }

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

  melangerDeck(deck: ICarte[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  jouerCarteSurTerrain(joueur: IPlayerState, carte: ICarte) {
    joueur.terrain.push(carte);
  }

  jouerCarteDansDefausse(joueur: IPlayerState, carte: ICarte) {
    joueur.defausse.push(carte);
  }

  mettreCarteDansMain(joueur: IPlayerState, carte: ICarte) {
    joueur.main.push(carte);
  }

  mettreCarteDansDeck(joueur: IPlayerState, carte: ICarte) {
    joueur.deck.push(carte);
  }

  updateScores(joueur: IPlayerState, adversaire: IPlayerState) {
    let sommePuissancesJoueur = 0;
    let sommePuissancesAdversaire = 0;

    for (let carte of joueur.terrain) {
      sommePuissancesJoueur += this.carteService.getPuissanceTotale(carte);
    }

    for (let carte of adversaire.terrain) {
      sommePuissancesAdversaire += this.carteService.getPuissanceTotale(carte);
    }

    joueur.score = sommePuissancesJoueur;
    adversaire.score = sommePuissancesAdversaire;
  }
}
