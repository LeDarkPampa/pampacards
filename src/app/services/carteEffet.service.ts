import { Injectable } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";
import {EffetEnum} from "../interfaces/EffetEnum";
import {IPlayerState} from "../interfaces/IPlayerState";
import {JoueurService} from "./joueur.service";
import {CarteService} from "./carte.service";
import {IPartie} from "../interfaces/IPartie";
import {TchatService} from "./tchat.service";
import {PartieService} from "./partie.service";
import {PopupService} from "./popup.service";

@Injectable({
  providedIn: 'root'
})
export class CarteEffetService {

  constructor(private joueurService: JoueurService, private carteService: CarteService,
              private tchatService: TchatService, private partieService: PartieService,
              private popupService: PopupService, private carteEffetService: CarteEffetService) { }

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
        this.partieService.jouerCarteSurTerrain(joueur, c);
        joueur.main.splice(i, 1);
      }
    }
  }

  handleTardif(carte: ICarte, tour: number) {
    carte.diffPuissanceInstant += tour;
  }

  handleMatinal(carte: ICarte, tour: number) {
    carte.diffPuissanceInstant -= tour;
  }

  handleTroisieme(carte: ICarte, tour: number) {
    if (tour === 3) {
      carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
    }
  }

  handleSecond(carte: ICarte, tour: number) {
    if (tour === 2) {
      carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
    }
  }

  handlePariEffect(joueur: IPlayerState, carte: ICarte) {
    let nbParis = 0;
    for (let c of joueur.terrain) {
      if (c.effet && c.effet.code === EffetEnum.PARI) {
        nbParis = nbParis + 1;
      }
    }

    if (nbParis == 2) {
      for (let c of joueur.terrain) {
        if (c.effet && c.effet.code === EffetEnum.PARI) {
          c.puissance = 7;
        }
      }
      carte.puissance = 7;
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
        this.partieService.mettreCarteDansDeck(joueur, carteSacrifiee);
        this.sendBotMessage(`${carteSacrifiee.nom} est remise dans le deck`, partieId);
        this.partieService.melangerDeck(joueur.deck);
      } else {
        this.partieService.jouerCarteDansDefausse(joueur, carteSacrifiee);
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

            this.partieService.jouerCarteSurTerrain(adversaire, carteRetiree);
            this.sendBotMessage(`${carteRetiree.nom} est envoyée sur le terrain adverse`, partie.id);
          }
          i--;
        }
      }
      carte.diffPuissanceInstant += puissanceAjoutee;
    }
  }

  handleReset(joueur: IPlayerState) {
    let tailleMain = joueur.main.length;
    while (joueur.main.length > 0) {
      this.partieService.mettreCarteDansDeck(joueur, <ICarte>joueur.main.shift());
    }

    this.partieService.melangerDeck(joueur.deck);

    for (let i = 0; i < tailleMain; i++) {
      this.partieService.mettreCarteDansMain(joueur, <ICarte>joueur.deck.shift());
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

  handleElectrocution(adversaire: IPlayerState, partieId: number) {
    if (!this.joueurService.hasPalissade(adversaire)) {
      const indexCarteAleatoire = Math.floor(Math.random() * adversaire.main.length);
      const carteAleatoire = adversaire.main[indexCarteAleatoire];

      if (this.carteService.isFidelite(carteAleatoire)) {
        this.partieService.mettreCarteDansDeck(adversaire, carteAleatoire);
        this.sendBotMessage(`${carteAleatoire.nom} est remise dans le deck`, partieId);
        this.partieService.melangerDeck(adversaire.deck);
      } else {
        this.partieService.jouerCarteDansDefausse(adversaire, carteAleatoire);
      }

      adversaire.main.splice(indexCarteAleatoire, 1);
    }
  }

  handleEnterrement(adversaire: IPlayerState, partieId: number) {
    if (!this.joueurService.hasCitadelle(adversaire)) {
      const carteDessusDeck = adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(`${carteDessusDeck.nom} est remise dans le deck`, partieId);
          this.partieService.mettreCarteDansDeck(adversaire, carteDessusDeck);
          this.partieService.melangerDeck(adversaire.deck);
        } else {
          this.sendBotMessage(`${carteDessusDeck.nom} est envoyée dans la défausse`, partieId);
          this.partieService.jouerCarteDansDefausse(adversaire, carteDessusDeck);
        }
      }
    }
  }

  handleDuoterrementEffect(adversaire: IPlayerState, partieId: number) {
    if (!this.joueurService.hasCitadelle(adversaire)) {
      const carteDessusDeck = adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(`${carteDessusDeck.nom} est remise dans le deck`, partieId);
          this.partieService.mettreCarteDansDeck(adversaire, carteDessusDeck);
          this.partieService.melangerDeck(adversaire.deck);
        } else {
          this.sendBotMessage(`${carteDessusDeck.nom} est envoyée dans la défausse`, partieId);
          this.partieService.jouerCarteDansDefausse(adversaire, carteDessusDeck);
        }
      }

      const carteDessusDeck2 = adversaire.deck.shift();

      if (carteDessusDeck2) {
        if (this.carteService.isFidelite(carteDessusDeck2)) {
          this.sendBotMessage(`${carteDessusDeck2.nom} est remise dans le deck`, partieId);
          this.partieService.mettreCarteDansDeck(adversaire, carteDessusDeck2);
          this.partieService.melangerDeck(adversaire.deck);
        } else {
          this.sendBotMessage(`${carteDessusDeck2.nom} est envoyée dans la défausse`, partieId);
          this.partieService.jouerCarteDansDefausse(adversaire, carteDessusDeck2);
        }
      }
    }
  }

  handleNuee(joueur: IPlayerState, carte: ICarte) {
    joueur.terrain.forEach(c => {
      if (c.id === carte.id) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  handlePoisson(adversaire: IPlayerState, carte: ICarte) {
    if (!this.joueurService.hasCitadelle(adversaire)) {
      for (let i = 0; i < carte.effet.valeurBonusMalus; i++) {
        this.partieService.mettreCarteDansDeck(adversaire, this.partieService.getPoissonPourri());
      }
      this.partieService.melangerDeck(adversaire.deck);
    }
  }

  handleSixEffect(joueur: IPlayerState, adversaire: IPlayerState, carte: ICarte) {
    carte.puissance = parseInt("6");
    if (!this.joueurService.hasCitadelle(adversaire)) {
      const temp = joueur.deck.slice();
      joueur.deck = adversaire.deck;
      adversaire.deck = temp;
    }
  }

  handleCinqEffect(joueur: IPlayerState, adversaire: IPlayerState, carte: ICarte) {
    carte.puissance = parseInt("5");
    if (!this.joueurService.hasPalissade(adversaire)) {
      const temp = joueur.main.slice();
      joueur.main = adversaire.main;
      adversaire.main = temp;
    }
  }

  handleQuatreEffect(joueur: IPlayerState, adversaire: IPlayerState, carte: ICarte, partieId: number) {
    carte.puissance = 4;
    if (!this.joueurService.hasPalissade(adversaire)) {
      if (joueur.main.length > 0 && adversaire.main.length > 0) {
        const randomIndexJoueur = Math.floor(Math.random() * joueur.main.length);
        const randomIndexAdversaire = Math.floor(Math.random() * adversaire.main.length);

        const carteJoueur = joueur.main.splice(randomIndexJoueur, 1)[0];
        const carteAdversaire = adversaire.main.splice(randomIndexAdversaire, 1)[0];

        this.partieService.mettreCarteDansMain(adversaire, carteJoueur);
        this.partieService.mettreCarteDansMain(joueur, carteAdversaire);
      } else {
        this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieId);
      }
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieId);
    }
  }

  handleMentalisme(adversaire: IPlayerState) {
    if (!this.joueurService.hasPalissade(adversaire) && adversaire.main.length > 0) {
      this.popupService.showVisionCartesDialog(adversaire.main);
    }
  }

  handleEspionEffect(joueur: IPlayerState, adversaire: IPlayerState) {
    if (adversaire.deck.filter.length > 0) {
      this.popupService.showVisionCartesDialog(adversaire.deck);
      this.partieService.melangerDeck(adversaire.deck);
      this.updateEffetsContinusAndScores(joueur, adversaire);
    }
  }

  handleVisionEffect(joueur: IPlayerState) {
    if (joueur.deck.filter.length > 0) {
      const troisPremieresCartes: ICarte[] = joueur.deck.slice(0, 3);
      this.popupService.showVisionCartesDialog(troisPremieresCartes);
    }
  }

  handleSecteEffect(carte: ICarte, adversaire: IPlayerState) {
    const valeur = carte.effet.valeurBonusMalus;
    carte.diffPuissanceInstant += valeur * adversaire.terrain.length;
  }

  handleCruauteEffect(carte: ICarte, adversaire: IPlayerState) {
    const valeur = carte.effet.valeurBonusMalus;
    carte.diffPuissanceInstant += valeur * adversaire.defausse.length;
  }

  handleHeritageEffect(carte: ICarte, joueur: IPlayerState) {
    const valeur = carte.effet.valeurBonusMalus;
    carte.diffPuissanceInstant += valeur * joueur.defausse.length;
  }

  handleEgoismeEffect(carte: ICarte, joueur: IPlayerState) {
    const valeur = carte.effet.valeurBonusMalus;
    carte.diffPuissanceInstant -= valeur * joueur.terrain.length;
  }

  handleSilenceEffect(joueur: IPlayerState, adversaire: IPlayerState, partieId: number) {
    if (adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)).length > 0) {
      const carteSelectionneeSub = this.popupService.selectAndHandleCard(adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)), joueur, partieId)
        .subscribe((selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(joueur.nom + ' cible la carte ' + selectedCarte.nom, partieId);
            const indexCarte = adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            adversaire.terrain[indexCarte].silence = true;
          }
          this.updateEffetsContinusAndScores(joueur, adversaire);
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieId);
    }
  }

  handleSauvetageEffect(joueur: IPlayerState, adversaire: IPlayerState, partieId: number) {
    if (!this.joueurService.hasCrypte(adversaire) && joueur.defausse.length > 0) {
      const carteSelectionneeSub = this.popupService.selectAndHandleCard(joueur.defausse, joueur, partieId)
        .subscribe((selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(joueur.nom + ' cible la carte ' + selectedCarte.nom, partieId);
            const indexCarte = joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.carteEffetService.recupererCarteEnMainDepuisDefausse(joueur.defausse[indexCarte], joueur);
          }
          this.carteEffetService.updateEffetsContinusAndScores(joueur, adversaire);
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieId);
    }
  }

  trahisonCarte(selectedCarte: ICarte, joueur: IPlayerState, adversaire: IPlayerState, partieId: number) {
    if (selectedCarte != null) {
      this.sendBotMessage(joueur.nom + ' trahit la carte ' + selectedCarte.nom, partieId);
      const indexCarte = joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

      const carte = joueur.terrain[indexCarte];

      if (this.carteService.isFidelite(carte)) {
        this.partieService.mettreCarteDansDeck(joueur, carte);
        this.sendBotMessage(carte.nom + ' est remise dans le deck', partieId);
        this.partieService.melangerDeck(joueur.deck);
      } else if (this.carteService.isCauchemard(carte)) {
        this.partieService.jouerCarteSurTerrain(adversaire, carte);
        this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse', partieId);
      } else {
        this.partieService.jouerCarteDansDefausse(joueur, carte);
      }

      joueur.terrain.splice(indexCarte, 1);
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

  recupererCarteEnMainDepuisDefausse(carte: ICarte, joueur: IPlayerState) {
    const index = joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        this.partieService.mettreCarteDansMain(joueur, carte);
      } else {
        this.partieService.mettreCarteDansMain(joueur, carte);
      }
    }
  }


  sendBotMessage(message: string, partieId: number) {
    this.tchatService.sendMessage(message, partieId);
  }

  updateEffetsContinusAndScores(joueur: IPlayerState, adversaire: IPlayerState) {
    this.resetBoucliersEtPuissances(joueur);
    this.resetBoucliersEtPuissances(adversaire);

    this.appliquerEffetsContinus(joueur, adversaire);
    this.appliquerEffetsContinus(adversaire, joueur);

    this.partieService.updateScores(joueur, adversaire);
  }
}
