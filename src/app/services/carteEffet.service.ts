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
import {CustomDialogService} from "./customDialog.service";

@Injectable({
  providedIn: 'root'
})
export class CarteEffetService {

  constructor(private joueurService: JoueurService, private carteService: CarteService,
              private tchatService: TchatService, private partieService: PartieService,
              private customDialogService: CustomDialogService) { }

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

  handleMeurtreEffect(partieDatas: IPartieDatas) {
    if (partieDatas.joueur.terrain.filter(c => !c.insensible).length > 0) {
      this.customDialogService.selectionnerCarte(partieDatas.joueur.terrain.filter(c => !c.insensible)).then((selectedCarte) => {
        if (selectedCarte) {
          this.detruireCarte(partieDatas, selectedCarte, 'joueur');
        }
      }).catch((error) => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handleSilenceEffect(partieDatas: IPartieDatas) {
    const targetTerrain = partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu));
    if (targetTerrain.length > 0) {
      this.customDialogService.selectionnerCarte(targetTerrain).then(selectedCarte => {
        if (selectedCarte != null) {
          this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom, partieDatas.partieId);
          const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.adversaire.terrain[indexCarte].silence = true;
        }
        this.updateEffetsContinusAndScores(partieDatas);
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handleSauvetageEffect(partieDatas: IPartieDatas) {
    if (!this.joueurService.hasCrypte(partieDatas.adversaire) && partieDatas.joueur.defausse.length > 0) {
      this.customDialogService.selectionnerCarte(partieDatas.joueur.defausse).then(selectedCarte => {
        if (selectedCarte != null) {
          this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom, partieDatas.partieId);
          const indexCarte = partieDatas.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.recupererCarteEnMainDepuisDefausse(partieDatas.joueur.defausse[indexCarte], partieDatas);
        }
        this.updateEffetsContinusAndScores(partieDatas);
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handleCasseMuraille(partieDatas: IPartieDatas) {
    const adversaireHasProtecteurForet = partieDatas.adversaire.terrain.some(c => c.effet && c.effet.code === EffetEnum.PROTECTEURFORET);

    const bouclierCartesFiltre = (carte: ICarte) => carte.bouclier && (!adversaireHasProtecteurForet || !(carte.clan.id === 1 || carte.type.id === 8));

    if (partieDatas.adversaire.terrain.some(bouclierCartesFiltre)) {
      this.customDialogService.selectionnerCarte(partieDatas.adversaire.terrain.filter(bouclierCartesFiltre)).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`, partieDatas.partieId);
          const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.adversaire.terrain[indexCarte].bouclier = false;
        } else {
          this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
        }
        this.updateEffetsContinusAndScores(partieDatas);
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handleConversionEffect(carte: ICarte, partieDatas: IPartieDatas) {
    const targetCards = partieDatas.joueur.terrain.filter(c => !c.insensible);

    if (targetCards.length > 0) {
      this.customDialogService.selectionnerCarte(targetCards)
        .then(selectedCarte => {
          if (selectedCarte != null) {
            this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom, partieDatas.partieId);
            const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            if (indexCarte !== -1) {
              partieDatas.joueur.terrain[indexCarte].type = carte.type;
              partieDatas.joueur.terrain[indexCarte].clan = carte.clan;
            }
          }
          this.updateEffetsContinusAndScores(partieDatas);
        })
        .catch(error => {
          console.error(error);
          this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handlePrisonEffect(partieDatas: IPartieDatas) {
    const targetCards = partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.prison);

    if (targetCards.length > 0) {
      this.customDialogService.selectionnerCarte(targetCards)
        .then(selectedCarte => {
          if (selectedCarte != null) {
            this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom, partieDatas.partieId);
            const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            if (indexCarte !== -1) {
              partieDatas.adversaire.terrain[indexCarte].prison = true;
            }
          }
          this.updateEffetsContinusAndScores(partieDatas);
        })
        .catch(error => {
          console.error(error);
          this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handleTargetSelectionEffect(partieDatas: IPartieDatas, carte: ICarte, effetCode: EffetEnum) {
    let targetTerrain: ICarte[] = [];
    let applyEffect: (selectedCarte: ICarte) => void;

    switch (effetCode) {
      case EffetEnum.SABOTAGE:
      case EffetEnum.KAMIKAZE:
        targetTerrain = partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.prison);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.adversaire.terrain[indexCarte].diffPuissanceInstant -= carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.SERVIABLE:
        targetTerrain = partieDatas.joueur.terrain.filter(c => !c.insensible && !c.prison && this.carteService.memeTypeOuClan(c, carte));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.joueur.terrain[indexCarte].diffPuissanceInstant += carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.BOUCLIER:
        targetTerrain = partieDatas.joueur.terrain.filter(c => !c.insensible && !c.bouclier);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.joueur.terrain[indexCarte].bouclier = true;
        };
        break;
      case EffetEnum.RECYCLAGE:
        targetTerrain = partieDatas.joueur.defausse;
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = partieDatas.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.mettreCarteEnDeckEnMainDepuisDefausse(partieDatas, partieDatas.joueur.defausse[indexCarte]);
        };
        break;
      case EffetEnum.CORRUPTION:
        targetTerrain = partieDatas.adversaire.terrain.filter(c => !c.bouclier && !(c.clan.nom === this.carteService.getNomCorrompu()));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.adversaire.terrain[indexCarte].clan = this.partieService.getClanCorrompu();
          partieDatas.adversaire.terrain[indexCarte].type = this.partieService.getTypeCorrompu();
        };
        break;
      case EffetEnum.POSSESSION:
        targetTerrain = partieDatas.adversaire.terrain.filter(c => {
          return this.carteService.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse && !c.bouclier && (c.clan.nom === this.carteService.getNomCorrompu());
        });
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.joueur.terrain.push(partieDatas.adversaire.terrain[indexCarte]);
          partieDatas.adversaire.terrain.splice(indexCarte, 1);
        };
        break;
    }

    if (targetTerrain.length > 0) {
      this.customDialogService.selectionnerCarte(targetTerrain).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`, partieDatas.partieId);
          applyEffect(selectedCarte);
        }
        this.updateEffetsContinusAndScores(partieDatas);
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handleEspionEffect(partieDatas: IPartieDatas) {
    if (partieDatas.adversaire.deck.filter.length > 0) {
      this.customDialogService.showVisionCartesDialog(partieDatas.adversaire.deck);
      this.partieService.melangerDeck(partieDatas.adversaire.deck);
      this.updateEffetsContinusAndScores(partieDatas);
    }
  }

  handleVisionEffect(partieDatas: IPartieDatas) {
    if (partieDatas.joueur.deck.filter.length > 0) {
      const troisPremieresCartes: ICarte[] = partieDatas.joueur.deck.slice(0, 3);
      this.customDialogService.showVisionCartesDialog(troisPremieresCartes);
      this.updateEffetsContinusAndScores(partieDatas);
    }
  }

  handleMentalisme(partieDatas: IPartieDatas) {
    if (!this.joueurService.hasPalissade(partieDatas.adversaire) && partieDatas.adversaire.main.length > 0) {
      this.customDialogService.showVisionCartesDialog(partieDatas.adversaire.main);
    }
  }

  handleVoixEffect(partieDatas: IPartieDatas) {
    const cartesAvecSilence = partieDatas.joueur.terrain.filter(c => c.silence);
    if (cartesAvecSilence.length > 0) {
      this.customDialogService.selectionnerCarte(cartesAvecSilence).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`, partieDatas.partieId);
          const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.joueur.terrain[indexCarte].silence = false;
        }
        this.updateEffetsContinusAndScores(partieDatas);
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  handleTrocEffect(partieDatas: IPartieDatas) {
    if (this.joueurService.hasPalissade(partieDatas.adversaire)) {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    } else if (partieDatas.joueur.main.length === 0) {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    } else {
      this.customDialogService.selectionnerCarte(partieDatas.joueur.main).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`, partieDatas.partieId);
          const indexCarte = partieDatas.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          const randomIndex = Math.floor(Math.random() * partieDatas.adversaire.main.length);

          const carteJoueur = partieDatas.joueur.main.splice(indexCarte, 1)[0];
          const carteAdversaire = partieDatas.adversaire.main.splice(randomIndex, 1)[0];

          partieDatas.adversaire.main.push(carteJoueur);
          partieDatas.joueur.main.push(carteAdversaire);
        } else {
          this.sendBotMessage('Aucune carte sélectionnée', partieDatas.partieId);
        }
        this.updateEffetsContinusAndScores(partieDatas);
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    }
  }

  handleTrahisonEffect(partieDatas: IPartieDatas) {
    const cartesNonInsensibles = partieDatas.joueur.terrain.filter(c => !c.insensible);
    if (cartesNonInsensibles.length > 0) {
      this.customDialogService.selectionnerCarte(cartesNonInsensibles).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} trahit la carte ${selectedCarte.nom}`, partieDatas.partieId);
          const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

          const carte = partieDatas.joueur.terrain[indexCarte];

          if (this.carteService.isFidelite(carte)) {
            partieDatas.joueur.deck.push(carte);
            this.sendBotMessage(`${carte.nom} est remise dans le deck`, partieDatas.partieId);
            this.partieService.melangerDeck(partieDatas.joueur.deck);
          } else if (this.carteService.isCauchemard(carte)) {
            partieDatas.adversaire.terrain.push(carte);
            this.sendBotMessage(`${carte.nom} est envoyée sur le terrain adverse`, partieDatas.partieId);
          } else {
            partieDatas.joueur.defausse.push(carte);
          }

          partieDatas.joueur.terrain.splice(indexCarte, 1);
        }
        this.updateEffetsContinusAndScores(partieDatas);
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir', partieDatas.partieId);
    }
  }

  mettreCarteEnDeckEnMainDepuisDefausse(partieDatas: IPartieDatas, carte: ICarte) {
    const index = partieDatas.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      partieDatas.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        partieDatas.joueur.deck.push(carte);
      } else {
        partieDatas.joueur.deck.push(carte);
      }
    }
    this.updateEffetsContinusAndScores(partieDatas);
  }

  recupererCarteEnMainDepuisDefausse(carte: ICarte, partieDatas: IPartieDatas) {
    const index = partieDatas.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      partieDatas.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        partieDatas.joueur.main.push(carte);
      } else {
        partieDatas.joueur.main.push(carte);
      }
    }

    this.updateEffetsContinusAndScores(partieDatas);
  }

  private detruireCarte(partieDatas: IPartieDatas, selectedCarte: ICarte, joueurType: 'joueur' | 'adversaire') {
    const joueur = joueurType === 'joueur' ? partieDatas.joueur : partieDatas.adversaire;
    const adversaire = joueurType === 'joueur' ? partieDatas.adversaire : partieDatas.joueur;

    this.sendBotMessage(`${joueur.nom} détruit la carte ${selectedCarte.nom}`, partieDatas.partieId);
    const indexCarte = joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
    const carte = joueur.terrain[indexCarte];

    if (this.carteService.isFidelite(carte)) {
      joueur.deck.push(carte);
      this.sendBotMessage(`${carte.nom} est remise dans le deck`, partieDatas.partieId);
      this.partieService.melangerDeck(joueur.deck);
    } else if (this.carteService.isCauchemard(carte)) {
      adversaire.terrain.push(carte);
      this.sendBotMessage(`${carte.nom} est envoyée sur le terrain adverse`, partieDatas.partieId);
    } else {
      joueur.defausse.push(carte);
    }

    joueur.terrain.splice(indexCarte, 1);

    if (joueurType === 'joueur' && adversaire.terrain.filter(c => !c.bouclier).length > 0) {
      this.customDialogService.selectionnerCarte(adversaire.terrain.filter(c => !c.bouclier)).then((selectedCarte) => {
        if (selectedCarte) {
          this.detruireCarte(partieDatas, selectedCarte, 'adversaire');
        }
      }).catch((error) => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte', partieDatas.partieId);
      });
    } else {
      this.updateEffetsContinusAndScores(partieDatas);
    }
  }

  updateEffetsContinusAndScores(partieDatas: IPartieDatas) {
    this.resetBoucliersEtPuissances(partieDatas.joueur);
    this.resetBoucliersEtPuissances(partieDatas.adversaire);

    this.appliquerEffetsContinus(partieDatas.joueur, partieDatas.adversaire);
    this.appliquerEffetsContinus(partieDatas.adversaire, partieDatas.joueur);

    this.partieService.updateScores(partieDatas);
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
