import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "./authentification.service";
import {ICarte} from "../interfaces/ICarte";
import {IPlayerState} from "../interfaces/IPlayerState";
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";
import {IPartieDatas} from "../interfaces/IPartieDatas";
import {CarteService} from "./carte.service";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {IPartie} from "../interfaces/IPartie";
import {PartieEventService} from "./partieEvent.service";
import {EffetEnum} from "../interfaces/EffetEnum";
import {CarteEffetService} from "./carteEffet.service";

@Injectable({
  providedIn: 'root'
})
export class PartieService {

  constructor(private http: HttpClient, private authService: AuthentificationService,
              private carteService: CarteService, private partieEventService: PartieEventService,
              private carteEffetService: CarteEffetService) { }

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

  updatePlayerAndOpponent(lastEvent: IEvenementPartie, partie: IPartie, partieDatas: IPartieDatas, userId: number) {
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

    partieDatas.joueur.id = joueurId;
    partieDatas.joueur.deck = joueurDeck.length > 0 ? JSON.parse(joueurDeck) : [];
    partieDatas.joueur.main = joueurMain.length > 0 ? JSON.parse(joueurMain) : [];
    partieDatas.joueur.terrain = joueurTerrain.length > 0 ? JSON.parse(joueurTerrain) : [];
    partieDatas.joueur.defausse = joueurDefausse.length > 0 ? JSON.parse(joueurDefausse) : [];

    partieDatas.adversaire.id = adversaireId;
    partieDatas.adversaire.deck = adversaireDeck.length > 0 ? JSON.parse(adversaireDeck) : [];
    partieDatas.adversaire.main = adversaireMain.length > 0 ? JSON.parse(adversaireMain) : [];
    partieDatas.adversaire.terrain = adversaireTerrain.length > 0 ? JSON.parse(adversaireTerrain) : [];
    partieDatas.adversaire.defausse = adversaireDefausse.length > 0 ? JSON.parse(adversaireDefausse) : [];
  }

  updateScores(partieDatas: IPartieDatas) {
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

  jouerCarte(carteJouee: ICarte, partie: IPartie, partieDatas: IPartieDatas, userId: number) {
    let stopJ1 = false;
    let stopJ2 = false;

    if (carteJouee.effet && !carteJouee.effet.continu) {
      this.carteEffetService.playInstantEffect(carteJouee, partie, partieDatas, userId).then(r => {
        if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEUR) {
          partieDatas.adversaire.terrain.push(carteJouee);
        } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEURPLUS) {
          carteJouee.puissance = -4;
          partieDatas.adversaire.terrain.push(carteJouee);
        } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.KAMIKAZE) {
          partieDatas.joueur.defausse.push(carteJouee);
        } else {
          partieDatas.joueur.terrain.push(carteJouee);
        }

        if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.STOP) {
          if (partieDatas.joueur.id == partie.joueurUn.id) {
            stopJ2 = true;
          } else if (partieDatas.joueur.id == partie.joueurDeux.id) {
            stopJ1 = true;
          }
        }

        this.carteEffetService.updateEffetsContinusAndScores(partieDatas);
        this.partieEventService.sendUpdatedGameAfterPlay(partie, userId, partieDatas.joueur, partieDatas.adversaire, partieDatas.lastEvent, stopJ1, stopJ2);
      });
    } else {
      partieDatas.joueur.terrain.push(carteJouee);
      this.carteEffetService.updateEffetsContinusAndScores(partieDatas);
      this.partieEventService.sendUpdatedGameAfterPlay(partie, userId, partieDatas.joueur, partieDatas.adversaire, partieDatas.lastEvent);
    }
  }

  terminerPartie(partie: IPartie, partieDatas: IPartieDatas) {
    this.updateScores(partieDatas);
    let scoreJoueur = partieDatas.joueur.score;
    let scoreAdversaire = partieDatas.adversaire.score;
    let vainqueurId = 0;
    if (scoreJoueur > scoreAdversaire) {
      partieDatas.nomVainqueur = partieDatas.joueur.nom;
      vainqueurId = partieDatas.joueur.id;
    } else if (scoreAdversaire > scoreJoueur) {
      partieDatas.nomVainqueur = partieDatas.adversaire.nom;
      vainqueurId = partieDatas.adversaire.id;
    } else if (scoreAdversaire == scoreJoueur) {
      partieDatas.nomVainqueur = 'égalité';
    }

    const event = this.partieEventService.createEndEvent(vainqueurId, partie, partieDatas.joueur, partieDatas.adversaire);
    this.partieEventService.enregistrerResultatFinPartie(event).subscribe({
      next: response => {
        // Traitement après enregistrement du résultat
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

}
