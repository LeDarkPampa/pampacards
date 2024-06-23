import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "./authentification.service";
import {ICarte} from "../interfaces/ICarte";
import {IPlayerState} from "../interfaces/IPlayerState";
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";
import {CarteService} from "./carte.service";
import {IPartie} from "../interfaces/IPartie";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {EffetEnum} from "../interfaces/EffetEnum";

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

  initValues(partie: IPartie, joueur: IPlayerState, adversaire: IPlayerState, userId: number) {
    let nomJoueur: string;
    let nomAdversaire: string;
    let idJoueur: number;
    let idAdversaire: number;

    if (partie.joueurUn.id === userId) {
      nomJoueur = partie.joueurUn.pseudo;
      idJoueur = partie.joueurUn.id;
      nomAdversaire = partie.joueurDeux.pseudo;
      idAdversaire = partie.joueurDeux.id;
    } else {
      nomJoueur = partie.joueurDeux.pseudo;
      idJoueur = partie.joueurDeux.id;
      nomAdversaire = partie.joueurUn.pseudo;
      idAdversaire = partie.joueurUn.id;
    }

    joueur = {
      id: idJoueur,
      nom: nomJoueur,
      main: [],
      terrain: [],
      deck: [],
      defausse: [],
      score: 0
    };

    adversaire = {
      id: idAdversaire,
      nom: nomAdversaire,
      main: [],
      terrain: [],
      deck: [],
      defausse: [],
      score: 0
    };
  }

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

  updatePlayerAndOpponent(partie: IPartie, joueur: IPlayerState, adversaire: IPlayerState, lastEvent: IEvenementPartie, userId: number) {
    const isJoueurUn = partie.joueurUn.id === userId;
    const joueurId = isJoueurUn ? partie.joueurUn.id : partie.joueurDeux.id;
    const adversaireId = isJoueurUn ? partie.joueurDeux.id : partie.joueurUn.id;
    const joueurDeck = isJoueurUn ? lastEvent.cartesDeckJoueurUn : lastEvent.cartesDeckJoueurDeux;
    const adversaireDeck = isJoueurUn ? lastEvent.cartesDeckJoueurDeux : lastEvent.cartesDeckJoueurUn;
    const joueurMain = isJoueurUn ? lastEvent.cartesMainJoueurUn : lastEvent.cartesMainJoueurDeux;
    const adversaireMain = isJoueurUn ? lastEvent.cartesMainJoueurDeux : lastEvent.cartesMainJoueurUn;
    const joueurTerrain = isJoueurUn ? lastEvent.cartesTerrainJoueurUn : lastEvent.cartesTerrainJoueurDeux;
    const adversaireTerrain = isJoueurUn ? lastEvent.cartesTerrainJoueurDeux : lastEvent.cartesTerrainJoueurUn;
    const joueurDefausse = isJoueurUn ? lastEvent.cartesDefausseJoueurUn : lastEvent.cartesDefausseJoueurDeux;
    const adversaireDefausse = isJoueurUn ? lastEvent.cartesDefausseJoueurDeux : lastEvent.cartesDefausseJoueurUn;

    joueur.id = joueurId;
    joueur.deck = joueurDeck.length > 0 ? JSON.parse(joueurDeck) : [];
    joueur.main = joueurMain.length > 0 ? JSON.parse(joueurMain) : [];
    joueur.terrain = joueurTerrain.length > 0 ? JSON.parse(joueurTerrain) : [];
    joueur.defausse = joueurDefausse.length > 0 ? JSON.parse(joueurDefausse) : [];

    adversaire.id = adversaireId;
    adversaire.deck = adversaireDeck.length > 0 ? JSON.parse(adversaireDeck) : [];
    adversaire.main = adversaireMain.length > 0 ? JSON.parse(adversaireMain) : [];
    adversaire.terrain = adversaireTerrain.length > 0 ? JSON.parse(adversaireTerrain) : [];
    adversaire.defausse = adversaireDefausse.length > 0 ? JSON.parse(adversaireDefausse) : [];
  }
}
