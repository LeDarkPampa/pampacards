import { Component, OnInit } from '@angular/core';
import {Deck} from "../classes/decks/Deck";
import {AuthentificationService} from "../services/authentification.service";
import {CarteAndQuantity} from "../classes/decks/CarteAndQuantity";
import {Format} from "../classes/decks/Format";
import {FiltersAndSortsValues} from "../classes/FiltersAndSortsValues";
import {DeckService} from "../services/deck.service";
import {CanComponentDeactivate} from "../CanComponentDeactivate";
import {Utilisateur} from "../classes/Utilisateur";
import {Message} from "primeng/api";
import {PropertiesService} from "../services/properties.service";
import {UtilisateurService} from "../services/utilisateur.service";
import {ReferentielService} from "../services/referentiel.service";
import {Carte} from "../classes/cartes/Carte";


@Component({
  selector: 'app-deckbuilder',
  templateUrl: './deckbuilder.component.html',
  styleUrls: ['./deckbuilder.component.css', '../app.component.css']
})
export class DeckbuilderComponent implements OnInit, CanComponentDeactivate {

  unsavedChanges = false;
  collectionJoueur: CarteAndQuantity[];
  collectionJoueurFiltree: CarteAndQuantity[];
  collectionJoueurFiltreeTriee: CarteAndQuantity[];
  decks: Deck[] = [];
  formats: Format[] = [];

  // @ts-ignore
  selectedDeck: Deck;
  nomDeck: string = '';

  // @ts-ignore
  selectedFormat: Format;
  nullFormat = {
      formatId: 0,
      nom: '',
      limitationCartes: []
  }

  totalRarete: number = 0;

  message: Message[] = [];
  hasExceededLimitation: Boolean = false;
  filtersAndSortsValues: FiltersAndSortsValues = {
    selectedClans: [],
    selectedTypes: [],
    selectedRaretes: [],
    sortValue: 'no'
  };


  constructor(
    private authService: AuthentificationService,
    private deckService: DeckService,
    private propertiesService: PropertiesService,
    private utilisateurService: UtilisateurService,
    private referentielService: ReferentielService
  ) {
    this.collectionJoueur = [];
    this.collectionJoueurFiltree = [];
    this.collectionJoueurFiltreeTriee = [];
  }

  ngOnInit() {
    this.collectionJoueurFiltree = [];
    this.collectionJoueurFiltreeTriee = [];
    this.utilisateurService.getAllDecks().subscribe(playerDecks => {
      this.decks = playerDecks;
      this.getAllFormats();
      this.getUserCollectionFiltered();
    });
  }

  selectDeck(deck: Deck) {
    this.unsavedChanges = false;
    this.selectedDeck = deck;
    this.nomDeck = this.selectedDeck.nom;
    this.selectedFormat = deck.formats[0];
    this.totalRarete = this.calculRarete(deck);
    this.resetValues();
  }

  newDeck() {
    this.unsavedChanges = false;
    const standardFormat = this.formats.find(format => format.nom === 'STANDARD');

    if (standardFormat) {
      this.selectedFormat = standardFormat;
    }

    // @ts-ignore
    const user:Utilisateur = this.authService.getUser();
    this.selectedDeck = {
      id: 0,
      nom:'',
      cartes:[],
      utilisateur: user,
      formats: [],
      dateCreation: new Date(Date.now())
    };

    this.totalRarete = 0;

    this.nomDeck = '';
    this.hasExceededLimitation = false;
    this.resetValues();
  }

  addCarte(carte: Carte) {
    if (this.selectedDeck && this.selectedFormat && this.selectedFormat.limitationCartes) {
      this.unsavedChanges = true;

      const validationError = this.deckService.validateDeck(this.selectedDeck, this.selectedFormat, carte);

      if (validationError) {
        this.message = [{ severity: 'warn', summary: 'Attention', detail: validationError }];
        return;
      }
    }

    this.selectedDeck.cartes.push(carte);
    this.totalRarete = this.calculRarete(this.selectedDeck);
    this.refreshCollectionFiltered();
    this.sortCartesDeck();
  }

  saveDeck() {
    let deck: Deck = this.selectedDeck;

    if (!this.nomDeck || this.nomDeck === '') {
      this.message = [{ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans nom' }];
      return;
    } else if (this.decks.some((existingDeck) => existingDeck.nom === this.nomDeck && existingDeck.id !== deck.id)) {
      this.message = [{ severity: 'error', summary: 'Erreur', detail: 'Deux decks ne peuvent pas avoir le même nom' }];
      return;
    } else if (!(deck.cartes.length === 20)) {
      this.message = [{ severity: 'error', summary: 'Erreur', detail: 'Le deck doit comporter 20 cartes' }];
      return;
    } else if (!this.selectedFormat) {
      this.message = [{ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans format' }];
      return;
    }

    const validationError = this.deckService.validateDeck(deck, this.selectedFormat);
    if (validationError) {
      this.message = [{ severity: 'error', summary: 'Erreur', detail: validationError }];
      return;
    }

    this.unsavedChanges = false;
    deck.nom = this.nomDeck;

    deck.formats = [];

    // On sauvegarde tous les formats pour lesquels le deck est valide
    this.formats.forEach(format => {
      if (this.deckService.validateDeck(this.selectedDeck, format) === null) {
        deck.formats.push(format);
      }
    })

    this.deckService.saveDeck(deck).subscribe(data => {
      this.utilisateurService.getAllDecks().subscribe(playerDecks => {
        this.decks = playerDecks;
        this.message = [{ severity: 'success', summary: 'Sauvegarde', detail: 'Deck sauvegardé' }];
      });
    });
  }

  removeCard(carte: Carte) {
    if (this.selectedDeck) {
      this.unsavedChanges = true;
      let indexCarte = this.selectedDeck.cartes.findIndex(card => card.id == carte.id);
      if (indexCarte >= 0) {
        this.selectedDeck.cartes.splice(indexCarte, 1);
      }
      this.totalRarete = this.calculRarete(this.selectedDeck);
      this.refreshCollectionFiltered();
      this.sortCartesDeck();
    }
  }

  duplicateDeck() {
    if (!this.validateDeckBeforeDuplication()) {
      return;
    }

    const duplicatedDeck: Deck = this.createDuplicatedDeck();
    this.copyCardsToDuplicatedDeck(duplicatedDeck);

    this.deckService.saveDeck(duplicatedDeck).subscribe(() => {
      this.utilisateurService.getAllDecks().subscribe(playerDecks => {
        this.decks = playerDecks;
      });
    });
  }

  private validateDeckBeforeDuplication(): boolean {
    const deck = this.selectedDeck;

    if (!deck.nom) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans nom' },
      ];
      return false;
    } else if (deck.cartes.length !== 20) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Le deck doit comporter 20 cartes' },
      ];
      return false;
    } else if (!this.selectedFormat) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans format' },
      ];
      return false;
    } else if (this.hasExceededLimitation) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Ce deck n\'est pas valide pour ce format.' },
      ];
      return false;
    }

    return true;
  }

  private createDuplicatedDeck(): Deck {
    const user: Utilisateur = this.authService.getUser(); // @ts-ignore

    return {
      id: 0,
      nom: `${this.selectedDeck.nom}-dupl`,
      cartes: [],
      utilisateur: user,
      formats: this.selectedDeck.formats,
      dateCreation: new Date(),
    };
  }

  private copyCardsToDuplicatedDeck(duplicatedDeck: Deck): void {
    this.selectedDeck.cartes.forEach(carte => {
      duplicatedDeck.cartes.push(carte); // @ts-ignore
    });
  }

  getUserCollectionFiltered() {
    const userId = this.authService.getUserId();
    this.utilisateurService.getCollection(userId).subscribe({
      next: data => {
        if (data && data.cartes && data.cartes.length > 0) {
          // @ts-ignore
          if (!(this.authService.getUser().testeur && this.propertiesService.isTestModeOn())) {
            data.cartes = data.cartes.filter(carte => carte.released);
          }

          data.cartes.forEach(carte => {
            let indexCarte = this.collectionJoueur.findIndex(card => card.carte.id === carte.id);
            if (indexCarte >= 0) {
              // Créer une nouvelle instance de l'objet avant de le modifier
              this.collectionJoueur[indexCarte].quantity = this.collectionJoueur[indexCarte].quantity + 1;
            } else {
              this.collectionJoueur.push({carte: carte, quantity: 1});
            }
          });
          this.collectionJoueurFiltree = this.deepCopy(this.collectionJoueur);
        }
        this.filtersAndSortsValues = {
          selectedClans: [],
          selectedTypes: [],
          selectedRaretes: [],
          sortValue: 'no'
        };

        this.refreshCollectionFiltered();
        this.sortCartesDeck();
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private getAllFormats() {
    this.referentielService.getAllFormats().subscribe({
      next: data => {
        this.formats = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des formats!', error);
      }
    });
  }

  delete() {
    let selectedDeck = this.selectedDeck;
    this.deckService.isDeckUtilise(selectedDeck).subscribe(
      (isUsed) => {
        if (isUsed) {
          this.message = [
            { severity: 'error', summary: 'Attention', detail: 'Impossible de supprimer un deck utilisé en tournoi / ligue' },
          ];
        } else {
          this.deckService.deleteDeck(selectedDeck).subscribe({
            next: data => {
              this.utilisateurService.getAllDecks().subscribe(playerDecks => {
                this.decks = playerDecks;
              });
              // @ts-ignore
              this.selectedDeck = null;
              this.resetValues();
            },
            error: error => {
              this.newDeck();
            }
          });
        }
      }
    );
  }

  private removeCartesCollectionDuSelectedDeck() {
    this.collectionJoueurFiltree = this.deepCopy(this.collectionJoueur);
    this.removeSelectedCardsFromUserCollection();
  }

  private removeSelectedCardsFromUserCollection() {
    this.selectedDeck?.cartes.forEach(carte => {
      const indexCarte = this.collectionJoueurFiltree.findIndex(card => card.carte.id === carte.id);
      if (indexCarte >= 0) {
        const cardEntry = this.collectionJoueurFiltree[indexCarte];
        if (cardEntry.quantity > 1) {
          cardEntry.quantity--;
        } else {
          this.collectionJoueurFiltree.splice(indexCarte, 1);
        }
      }
    });
  }

  onFormatChange() {
    const validationError = this.deckService.validateDeck(this.selectedDeck, this.selectedFormat);
    if (validationError) {
      this.message = [{ severity: 'error', summary: 'Erreur', detail: validationError }];
      return;
    }
  }

  applyFilters(filtersAndSortsValues: FiltersAndSortsValues) {
    this.collectionJoueurFiltreeTriee = this.collectionJoueurFiltree.filter((carte: CarteAndQuantity) => {
      if (filtersAndSortsValues.selectedClans && filtersAndSortsValues.selectedClans.length > 0
        && filtersAndSortsValues.selectedClans.indexOf(carte.carte.clan.nom) == -1) {
        return false;
      }
      if (filtersAndSortsValues.selectedTypes && filtersAndSortsValues.selectedTypes.length > 0
        && filtersAndSortsValues.selectedTypes.indexOf(carte.carte.type.nom) == -1) {
        return false;
      }
      return !(filtersAndSortsValues.selectedRaretes && filtersAndSortsValues.selectedRaretes.length > 0
        && filtersAndSortsValues.selectedRaretes.indexOf(carte.carte.rarete) == -1);
    });
    this.sortCards(filtersAndSortsValues.sortValue);
  }

  sortCards(sortValue: string) {
    if (sortValue != '' && sortValue != 'no') {
      this.collectionJoueurFiltreeTriee.sort((carteA, carteB) => {
        let value1;
        let value2;
        if (sortValue === 'clan-asc') {
          const clanComparison = carteA.carte.clan.nom.localeCompare(carteB.carte.clan.nom);
          if (clanComparison != 0) {
            return clanComparison;
          } else {
            return carteA.carte.nom.localeCompare(carteB.carte.nom);
          }
        } else if (sortValue === 'clan-desc') {
          const clanComparison = carteB.carte.clan.nom.localeCompare(carteA.carte.clan.nom);
          if (clanComparison != 0) {
            return clanComparison;
          } else {
            return carteB.carte.nom.localeCompare(carteA.carte.nom);
          }
        } else if (sortValue === 'nom-asc') {
          value1 = carteA.carte.nom;
          value2 = carteB.carte.nom;
        } else if (sortValue === 'nom-desc') {
          value1 = carteB.carte.nom;
          value2 = carteA.carte.nom;
        } else if (sortValue === 'rarete-asc') {
          const rareteComparison = carteA.carte.rarete - carteB.carte.rarete;
          if (rareteComparison != 0) {
            return rareteComparison;
          } else {
            return carteA.carte.nom.localeCompare(carteB.carte.nom);
          }
        } else if (sortValue === 'rarete-desc') {
          const rareteComparison = carteB.carte.rarete - carteA.carte.rarete;
          if (rareteComparison != 0) {
            return rareteComparison;
          } else {
            return carteB.carte.nom.localeCompare(carteA.carte.nom);
          }
        } else if (sortValue === '') {
          value1 = carteA.carte.rarete;
          value2 = carteB.carte.rarete;
        } else {
          value1 = carteA.carte.nom;
          value2 = carteB.carte.nom;
        }
        if (value1 < value2) {
          return -1;
        }
        if (value1 > value2) {
          return 1;
        }
        return 0;
      });
    } else {
      this.collectionJoueurFiltreeTriee.sort((carteA, carteB) => {
        const clanComparison = carteA.carte.clan.nom.localeCompare(carteB.carte.clan.nom);
        if (clanComparison != 0) {
          return clanComparison;
        } else {
          return carteA.carte.nom.localeCompare(carteB.carte.nom);
        }
      });
    }
  }

  private resetValues() {
    this.filtersAndSortsValues = {
      selectedClans: [],
      selectedTypes: [],
      selectedRaretes: [],
      sortValue: 'no'
    };
    this.refreshCollectionFiltered();
  }

  canDeactivate(): boolean {
    if (this.unsavedChanges) {
      return window.confirm(
        'Vous avez un deck en cours de modification. Voulez-vous vraiment quitter la page ?'
      );
    } else {
      return true;
    }
  }

  refreshCollectionFiltered() {
    this.removeCartesCollectionDuSelectedDeck();
    this.applyFilters(this.filtersAndSortsValues);
  }

  calculRarete(deck: Deck) {
    return deck.cartes.reduce((somme, carte) => somme + carte.rarete, 0);
  }

  private deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  getFormatsNomForDeck(deck: Deck): string {
    let nomsFormats = '';
    for (const format of deck.formats) {
      this.formats.find(format => format.formatId ===  format.formatId);

      if (format) {
        if (nomsFormats.length > 0) {
          nomsFormats += ' - ' + format.nom;
        } else {
          nomsFormats += format.nom;
        }
      }
    }

    return nomsFormats;
  }

  sortCartesDeck() {
    if (this.selectedDeck) {
      this.selectedDeck.cartes.sort((n1,n2) =>
      {
        return n1.nom.localeCompare(n2.nom);
      });
    }
  }
}
