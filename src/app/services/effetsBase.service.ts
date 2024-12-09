import {Injectable} from '@angular/core';
import {EffetEnum} from "../enums/EffetEnum";
import {PlayerState} from "../classes/parties/PlayerState";
import {JoueurService} from "./joueur.service";
import {PartieDatas} from "../classes/parties/PartieDatas";
import {CarteService} from "./carte.service";
import {Clan} from "../classes/cartes/Clan";
import {Type} from "../classes/cartes/Type";
import {CartePartie} from "../classes/cartes/CartePartie";
import {TchatService} from "./tchat.service";

@Injectable({
  providedIn: 'root'
})
export class EffetsBaseService {

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
    released: false,
    cartePartieId: 0,
    silence: false,
    bouclier: false,
    insensible: false,
    prison: false,
    diffPuissanceInstant: 0,
    diffPuissanceContinue: 0
  };

  constructor(private joueurService: JoueurService, private tchatService: TchatService,
              private carteService: CarteService) {
  }

  addBouclier(carte: CartePartie) {
    carte.bouclier = true;
  }

  addInsensible(carte: CartePartie) {
    carte.bouclier = true;
    carte.insensible = true;
  }

  addBouclierPlus(carte: CartePartie) {
    carte.bouclier = true;
    carte.diffPuissanceInstant += 1;
  }

  addInsensiblePlus(carte: CartePartie) {
    carte.bouclier = true;
    carte.insensible = true;
    carte.diffPuissanceInstant += 1;
  }

  private ajouterCarteDepuisDefausse(carte: CartePartie, partieDatas: PartieDatas, destination: 'deck' | 'main') {
    const index = partieDatas.joueur.defausse.findIndex(c => c.cartePartieId === carte.cartePartieId);
    if (index !== -1) {
      partieDatas.joueur.defausse.splice(index, 1);  // On enlève la carte de la défausse

      if (carte.effet.code !== 'NO' && !carte.effet.continu && carte.effet.code === EffetEnum.SURVIVANT) {
        carte.diffPuissanceInstant += 2;
      }

      partieDatas.joueur[destination].push(carte);
    }

    this.updateEffetsContinusAndScores(partieDatas);
  }

  mettreCarteEnDeckDepuisDefausse(partieDatas: PartieDatas, carte: CartePartie) {
    this.ajouterCarteDepuisDefausse(carte, partieDatas, 'deck');
  }

  recupererCarteEnMainDepuisDefausse(carte: CartePartie, partieDatas: PartieDatas) {
    this.ajouterCarteDepuisDefausse(carte, partieDatas, 'main');
  }

  updateEffetsContinusAndScores(partieDatas: PartieDatas) {
    this.resetBoucliersEtPuissances(partieDatas.joueur);
    this.resetBoucliersEtPuissances(partieDatas.adversaire);

    this.appliquerEffetsContinus(partieDatas.joueur, partieDatas.adversaire);
    this.appliquerEffetsContinus(partieDatas.adversaire, partieDatas.joueur);
  }

  appliquerEffetsContinus(source: PlayerState, cible: PlayerState) {
    source.terrain.forEach((carte, index) => {
      if (carte.effet.code != 'NO' && carte.effet.continu && !carte.silence) {
        switch (carte.effet.code) {
          case EffetEnum.VAMPIRISME:
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * cible.defausse.length;
            break;
          case EffetEnum.CANNIBALE:
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * source.defausse.length;
            break;
          case EffetEnum.ESPRIT_EQUIPE:
            source.terrain.forEach((carteCible, indexCible) => {
              if (index !== indexCible && this.carteService.memeTypeOuClan(carteCible, carte)) {
                carte.diffPuissanceContinue++;
              }
            });
            break;
          case EffetEnum.MELEE:
            if (source.terrain.some(carteCible => carteCible.id === carte.id)) {
              carte.diffPuissanceContinue++;
            }
            break;
          case EffetEnum.CAPITAINE:
            source.terrain.forEach((carteCible, indexCible) => {
              if (index !== indexCible && !carteCible.insensible && this.carteService.memeTypeOuClan(carteCible, carte)) {
                carteCible.diffPuissanceContinue++;
              }
            });
            break;
          case EffetEnum.SYMBIOSE:
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * source.deck.length;
            break;
          case EffetEnum.SANG_PUR:
            if (source.terrain.every(carteCible => this.carteService.memeTypeOuClan(carteCible, carte))) {
              carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
            }
            break;
          case EffetEnum.TSUNAMI:
            cible.terrain.forEach(carteCible => {
              if (!carteCible.bouclier) {
                carteCible.diffPuissanceContinue--;
              }
            });
            break;
          case EffetEnum.DOMINATION:
            cible.terrain.forEach(carteCible => {
              if (!carteCible.bouclier && carteCible.clan.nom === this.getNomCorrompu()) {
                carteCible.diffPuissanceContinue--;
              }
            });
            break;
          case EffetEnum.RESISTANCE:
            if (source.defausse.length < 3) {
              carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
            }
            break;
          case EffetEnum.ILLUMINATI:
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * cible.terrain.length;
            break;
          default:
            break;
        }
      }
    });
  }

  resetBoucliersEtPuissances(joueur: PlayerState) {
    const hasProtecteurForet = this.joueurService.hasProtecteurForet(joueur);

    for (let carte of joueur.terrain) {
      carte.diffPuissanceContinue = 0;
      if (hasProtecteurForet && (1 === carte.clan.id || 8 === carte.type.id)) {
        carte.bouclier = true;
      }
    }
  }

  getTourAffiche(partieDatas: PartieDatas) {
    return Math.ceil((partieDatas.lastEvent ? partieDatas.lastEvent.tour : 0) / 2);
  }

  melangerDeck(deck: CartePartie[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  echangerMains(partieDatas: PartieDatas) {
    if (!this.joueurService.hasPalissade(partieDatas.adversaire)) {
      const temp = partieDatas.joueur.main.slice();
      partieDatas.joueur.main = partieDatas.adversaire.main;
      partieDatas.adversaire.main = temp;
    }
  }

  echangerDecks(partieDatas: PartieDatas) {
    if (!this.joueurService.hasCitadelle(partieDatas.adversaire)) {
      const temp = partieDatas.joueur.deck.slice();
      partieDatas.joueur.deck = partieDatas.adversaire.deck;
      partieDatas.adversaire.deck = temp;
    }
  }

  echanger1CarteAleatoireDeMains(partieDatas: PartieDatas) {
    if (!this.joueurService.hasPalissade(partieDatas.adversaire)) {
      if (partieDatas.joueur.main.length > 0 && partieDatas.adversaire.main.length > 0) {
        const randomIndexJoueur = Math.floor(Math.random() * partieDatas.joueur.main.length);
        const randomIndexAdversaire = Math.floor(Math.random() * partieDatas.adversaire.main.length);

        const carteJoueur = partieDatas.joueur.main.splice(randomIndexJoueur, 1)[0];
        const carteAdversaire = partieDatas.adversaire.main.splice(randomIndexAdversaire, 1)[0];

        partieDatas.adversaire.main.push(carteJoueur);
        partieDatas.joueur.main.push(carteAdversaire);
      } else {
        this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
      }
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  getClanCorrompu(): Clan {
    return this.clanCorrompu;
  }

  getTypeCorrompu(): Type {
    return this.typeCorrompu;
  }

  getNomCorrompu(): string {
    return this.nomCorrompu;
  }

  sendBotMessage(message: string, partieId: number) {
    this.tchatService.sendMessage(message, partieId);
  }
}
