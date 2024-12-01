import { Injectable } from '@angular/core';
import {JoueurService} from "./joueur.service";
import {CarteService} from "./carte.service";
import {TchatService} from "./tchat.service";
import {PartieService} from "./partie.service";
import {PlayerState} from "../classes/parties/PlayerState";
import {Partie} from "../classes/parties/Partie";
import {CartePartie} from "../classes/cartes/CartePartie";
import {EffetEnum} from "../enums/EffetEnum";

@Injectable({
  providedIn: 'root'
})
export class CarteEffetService {

  constructor(private joueurService: JoueurService, private carteService: CarteService,
              private tchatService: TchatService, private partieService: PartieService) { }

  addImmunise(carte: CartePartie) {
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

  handleHeroisme(carte: CartePartie, adversaire: PlayerState) {
    if (carte && carte.effet) {
      let atLeastOne = adversaire.terrain.some((carteCible: CartePartie) => this.carteService.getPuissanceTotale(carteCible) >= carte.effet.conditionPuissanceAdverse);
      if (atLeastOne) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    }
  }

  handleAmitie(carte: CartePartie, joueur: PlayerState) {
    joueur.terrain.forEach(c => {
      if (!carte.insensible && !carte.prison && this.carteService.memeTypeOuClan(carte, c)) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  handleSoutien(carte: CartePartie, joueur: PlayerState) {
    joueur.terrain.forEach(c => {
      if (!c.insensible && !c.prison && this.carteService.memeTypeOuClan(c, carte)) {
        c.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  handleMeute(carte: CartePartie, joueur: PlayerState) {
    for (let i = joueur.main.length - 1; i >= 0; i--) {
      const c = joueur.main[i];
      if (carte.id === c.id) {
        joueur.terrain.push(c);
        joueur.main.splice(i, 1);
      }
    }
  }

  handleResistanceInstant(carte: CartePartie, joueur: PlayerState) {
    if (joueur.defausse.length < 3) {
      carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
    }
  }

  handleSacrifice(joueur: PlayerState, partieId: number) {
    let carteSacrifiee = joueur.deck.shift();
    if (carteSacrifiee) {
      this.sendBotMessage(`${carteSacrifiee.nom} est sacrifiée`, partieId);
      if (this.carteService.isFidelite(carteSacrifiee)) {
        joueur.deck.push(carteSacrifiee);
        this.sendBotMessage(`${carteSacrifiee.nom} est remise dans le deck`, partieId);
        this.partieService.melangerDeck(joueur.deck);
      } else {
        joueur.defausse.push(carteSacrifiee);
      }
    }
  }

  handleAbsorption(joueur: PlayerState, adversaire: PlayerState) {
    if (!this.joueurService.hasCrypte(adversaire)) {
      joueur.defausse = [];
    }

    adversaire.defausse = [];
  }

  handleFusion(carte: CartePartie, joueur: PlayerState, adversaire: PlayerState, partie: Partie) {
    if (carte && carte.effet.code != 'NO') {
      carte.bouclier = true;
      carte.insensible = true;

      let puissanceAjoutee = 0;
      for (let i = 0; i < joueur.terrain.length; i++) {
        let carteCible = joueur.terrain[i];
        if (this.carteService.memeTypeOuClan(carteCible, carte) && !carteCible.insensible) {
          puissanceAjoutee += carte.effet.valeurBonusMalus;

          const carteRetiree = joueur.terrain.splice(i, 1)[0];
          if (this.carteService.isCauchemard(carteRetiree)) {
            adversaire.terrain.push(carteRetiree);
            this.sendBotMessage(`${carteRetiree.nom} est envoyée sur le terrain adverse`, partie.id);
          }
          i--;
        }
      }
      carte.diffPuissanceInstant += puissanceAjoutee;
    }
  }

  handleReset(joueur: PlayerState) {
    let tailleMain = joueur.main.length;
    while (joueur.main.length > 0) {
      joueur.deck.push(<CartePartie>joueur.main.shift());
    }

    this.partieService.melangerDeck(joueur.deck);

    for (let i = 0; i < tailleMain; i++) {
      joueur.main.push(<CartePartie>joueur.deck.shift());
    }
  }

  handleTerror(carte: CartePartie, adversaire: PlayerState) {
    adversaire.terrain.forEach(c => {
      if (!c.bouclier && !c.prison) {
        c.diffPuissanceInstant -= carte.effet.valeurBonusMalus;
      }
    });
  }

  handleDevoreur(carte: CartePartie, joueur: PlayerState, adversaire: PlayerState) {
    if (!this.joueurService.hasCrypte(adversaire)) {
      carte.diffPuissanceInstant += joueur.defausse.length;
      joueur.defausse = [];
    }
  }

  handlePari(carte: CartePartie, joueur: PlayerState) {
    const nbParis = joueur.terrain.filter(c => c.effet && c.effet.code === EffetEnum.PARI).length;
    if (nbParis === 2) {
      joueur.terrain.forEach(c => {
        if (c.effet && c.effet.code === EffetEnum.PARI) {
          c.puissance = 7;
        }
      });
      carte.puissance = 7;
    }
  }

  handleSeptEffect(carte: CartePartie, joueur: PlayerState, adversaire: PlayerState) {
    carte.puissance = parseInt("7");

    if (!this.joueurService.hasPalissade(adversaire)) {
      const temp = joueur.main.slice();
      joueur.main = adversaire.main;
      adversaire.main = temp;
    }

    if (!this.joueurService.hasCitadelle(adversaire)) {
      const temp = joueur.deck.slice();
      joueur.deck = adversaire.deck;
      adversaire.deck = temp;
    }
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
              if (!carteCible.bouclier && carteCible.clan.nom === this.carteService.getNomCorrompu()) {
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

  sendBotMessage(message: string, partieId: number) {
    this.tchatService.sendMessage(message, partieId);
  }
}
