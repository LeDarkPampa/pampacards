import { Injectable } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";
import {EffetEnum} from "../interfaces/EffetEnum";
import {IPlayerState} from "../interfaces/IPlayerState";
import {JoueurService} from "./joueur.service";
import {CarteService} from "./carte.service";
import {IPartie} from "../interfaces/IPartie";
import {TchatService} from "./tchat.service";
import {PartieService} from "./partie.service";
import {IPartieDatas} from "../interfaces/IPartieDatas";

@Injectable({
  providedIn: 'root'
})
export class CarteEffetService {

  constructor(private joueurService: JoueurService, private carteService: CarteService,
              private tchatService: TchatService, private partieService: PartieService) { }

  addImmunise(carte: ICarte) {
    carte.bouclier = true;
  }

  addInsensible(carte: ICarte) {
    carte.bouclier = true;
    carte.insensible = true;
  }

  addBouclierPlus(carte: ICarte) {
    carte.bouclier = true;
    carte.diffPuissanceInstant += 1;
  }

  addInsensiblePlus(carte: ICarte) {
    carte.bouclier = true;
    carte.insensible = true;
    carte.diffPuissanceInstant += 1;
  }

  handleHeroisme(carte: ICarte, adversaire: IPlayerState) {
    if (carte && carte.effet) {
      let atLeastOne = adversaire.terrain.some((carteCible: ICarte) => this.carteService.getPuissanceTotale(carteCible) >= carte.effet.conditionPuissanceAdverse);
      if (atLeastOne) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    }
  }

  handleAmitie(carte: ICarte, joueur: IPlayerState) {
    joueur.terrain.forEach(c => {
      if (!carte.insensible && !carte.prison && this.carteService.memeTypeOuClan(carte, c)) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  handleSoutien(carte: ICarte, joueur: IPlayerState) {
    joueur.terrain.forEach(c => {
      if (!c.insensible && !c.prison && this.carteService.memeTypeOuClan(c, carte)) {
        c.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  handleMeute(carte: ICarte, joueur: IPlayerState) {
    for (let i = joueur.main.length - 1; i >= 0; i--) {
      const c = joueur.main[i];
      if (carte.id === c.id) {
        joueur.terrain.push(c);
        joueur.main.splice(i, 1);
      }
    }
  }

  handleResistanceInstant(carte: ICarte, joueur: IPlayerState) {
    if (joueur.defausse.length < 3) {
      carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
    }
  }

  handleSacrifice(joueur: IPlayerState, partieId: number) {
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

  handleAbsorption(joueur: IPlayerState, adversaire: IPlayerState) {
    if (!this.joueurService.hasCrypte(adversaire)) {
      joueur.defausse = [];
    }

    adversaire.defausse = [];
  }

  handleFusion(carte: ICarte, joueur: IPlayerState, adversaire: IPlayerState, partie: IPartie) {
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

  handlePari(carte: ICarte, partieDatas: IPartieDatas) {
    let nbParis = 0;
    for (let c of partieDatas.joueur.terrain) {
      if (c.effet && c.effet.code === EffetEnum.PARI) {
        nbParis = nbParis + 1;
      }
    }

    if (nbParis == 2) {
      for (let c of partieDatas.joueur.terrain) {
        if (c.effet && c.effet.code === EffetEnum.PARI) {
          c.puissance = 7;
        }
      }
      carte.puissance = 7;
    }
  }

  handleElectrocution(partieDatas: IPartieDatas) {
    if (!this.joueurService.hasPalissade(partieDatas.adversaire)) {
      const indexCarteAleatoire = Math.floor(Math.random() * partieDatas.adversaire.main.length);
      const carteAleatoire = partieDatas.adversaire.main[indexCarteAleatoire];

      if (this.carteService.isFidelite(carteAleatoire)) {
        partieDatas.adversaire.deck.push(carteAleatoire);
        this.sendBotMessage(`${carteAleatoire.nom} est remise dans le deck`, partieDatas.partieId);
        this.partieService.melangerDeck(partieDatas.adversaire.deck);
      } else {
        partieDatas.adversaire.defausse.push(carteAleatoire);
      }

      partieDatas.adversaire.main.splice(indexCarteAleatoire, 1);
    }
  }

  handleEnterrement(partieDatas: IPartieDatas) {
    if (!this.joueurService.hasCitadelle(partieDatas.adversaire)) {
      const carteDessusDeck = partieDatas.adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck', partieDatas.partieId);
          partieDatas.adversaire.deck.push(carteDessusDeck);
          this.partieService.melangerDeck(partieDatas.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse', partieDatas.partieId);
          partieDatas.adversaire.defausse.push(carteDessusDeck);
        }
      }
    }
  }

  handleDuoterrementEffect(partieDatas: IPartieDatas) {
    if (!this.joueurService.hasCitadelle(partieDatas.adversaire)) {
      const carteDessusDeck = partieDatas.adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck', partieDatas.partieId);
          partieDatas.adversaire.deck.push(carteDessusDeck);
          this.partieService.melangerDeck(partieDatas.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse', partieDatas.partieId);
          partieDatas.adversaire.defausse.push(carteDessusDeck);
        }
      }

      const carteDessusDeck2 = partieDatas.adversaire.deck.shift();

      if (carteDessusDeck2) {
        if (this.carteService.isFidelite(carteDessusDeck2)) {
          this.sendBotMessage(carteDessusDeck2.nom + ' est remise dans le deck', partieDatas.partieId);
          partieDatas.adversaire.deck.push(carteDessusDeck2);
          this.partieService.melangerDeck(partieDatas.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck2.nom + ' est envoyée dans la défausse', partieDatas.partieId);
          partieDatas.adversaire.defausse.push(carteDessusDeck2);
        }
      }
    }
  }

  handlePoisson(carte: ICarte, partieDatas: IPartieDatas) {
    if (!this.joueurService.hasCitadelle(partieDatas.adversaire)) {
      for (let i = 0; i < carte.effet.valeurBonusMalus; i++) {
        partieDatas.adversaire.deck.push(this.partieService.getPoissonPourri());
      }
      this.partieService.melangerDeck(partieDatas.adversaire.deck);
    }
  }

  handleNuee(carte: ICarte, partieDatas: IPartieDatas) {
    partieDatas.joueur.terrain.forEach(c => {
      if (c.id === carte.id) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  handleQuatreEffect(carte: ICarte, partieDatas: IPartieDatas) {
    carte.puissance = 4;
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

  handleCinqEffect(carte: ICarte, partieDatas: IPartieDatas) {
    carte.puissance = parseInt("5");
    if (!this.joueurService.hasPalissade(partieDatas.adversaire)) {
      const temp = partieDatas.joueur.main.slice();
      partieDatas.joueur.main = partieDatas.adversaire.main;
      partieDatas.adversaire.main = temp;
    }
  }

  handleSixEffect(carte: ICarte, partieDatas: IPartieDatas) {
    carte.puissance = parseInt("6");
    if (!this.joueurService.hasCitadelle(partieDatas.adversaire)) {
      const temp = partieDatas.joueur.deck.slice();
      partieDatas.joueur.deck = partieDatas.adversaire.deck;
      partieDatas.adversaire.deck = temp;
    }
  }


  handleReset(joueur: IPlayerState) {
    let tailleMain = joueur.main.length;
    while (joueur.main.length > 0) {
      joueur.deck.push(<ICarte>joueur.main.shift());
    }

    this.partieService.melangerDeck(joueur.deck);

    for (let i = 0; i < tailleMain; i++) {
      joueur.main.push(<ICarte>joueur.deck.shift());
    }
  }

  handleTerror(carte: ICarte, adversaire: IPlayerState) {
    adversaire.terrain.forEach(c => {
      if (!c.bouclier && !c.prison) {
        c.diffPuissanceInstant -= carte.effet.valeurBonusMalus;
      }
    });
  }

  handleDevoreur(carte: ICarte, joueur: IPlayerState, adversaire: IPlayerState) {
    if (!this.joueurService.hasCrypte(adversaire)) {
      carte.diffPuissanceInstant += joueur.defausse.length;
      joueur.defausse = [];
    }
  }

  handleSeptEffect(carte: ICarte, joueur: IPlayerState, adversaire: IPlayerState) {
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

  resetBoucliersEtPuissances(joueur: IPlayerState) {
    const hasProtecteurForet = this.joueurService.getJoueurHasProtecteurForet(joueur);

    for (let carte of joueur.terrain) {
      carte.diffPuissanceContinue = 0;
      if (hasProtecteurForet && (1 === carte.clan.id || 8 === carte.type.id)) {
        carte.bouclier = true;
      }
    }
  }

  appliquerEffetsContinus(source: IPlayerState, cible: IPlayerState) {
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
