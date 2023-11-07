import { Component, OnInit } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";
import {HttpClient} from "@angular/common/http";
import {IDeck} from "../interfaces/IDeck";
import {ICollection} from "../interfaces/ICollection";
import {AuthentificationService} from "../services/authentification.service";
import {ICarteAndQuantity} from "../interfaces/ICarteAndQuantity";
import {IFormat} from "../interfaces/IFormat";
import {ILimitationCarte} from "../interfaces/ILimitationCarte";
import {PropertiesService} from "../services/properties.service";
import {ClanService} from "../services/clan.service";
import {TypeService} from "../services/type.service";
import {IFiltersAndSortsValues} from "../interfaces/IFiltersAndSortsValues";
import {DeckService} from "../services/deck.service";
import {CanComponentDeactivate} from "../interfaces/CanComponentDeactivate";
import {IUtilisateur} from "../interfaces/IUtilisateur";

@Component({
  selector: 'app-deckbuilder',
  templateUrl: './deckbuilder.component.html',
  styleUrls: ['./deckbuilder.component.css', '../app.component.css', '../app.component.css']
})
export class DeckbuilderComponent implements OnInit, CanComponentDeactivate {

  unsavedChanges = false;
  private errorMessage: any;
  collectionJoueur: ICarteAndQuantity[];
  collectionJoueurFiltree: ICarteAndQuantity[];
  decks: IDeck[] = [];
  formats: IFormat[] = [];

  // @ts-ignore
  selectedDeck: IDeck;
  nomDeck: string = '';

  // @ts-ignore
  selectedFormat: IFormat;
  nullFormat = {
      formatId: 0,
      nom: '',
      limitationCartes: []
  }
  // @ts-ignore
  error: Message[];
  // @ts-ignore
  hasExceededLimitation: Boolean;
  filtersAndSortsValues: IFiltersAndSortsValues = {
    selectedClans: [],
    selectedTypes: [],
    selectedRaretes: [],
    sortValue: 'no'
  };

  constructor(private http: HttpClient, private authService: AuthentificationService, private clanService: ClanService,
              private typeService: TypeService, private propertiesService: PropertiesService,
              private deckService: DeckService) {
    this.collectionJoueur = [];
    this.collectionJoueurFiltree = [];
  }

  ngOnInit() {
    this.filtersAndSortsValues = {
      selectedClans: [],
      selectedTypes: [],
      selectedRaretes: [],
      sortValue: 'no'
    };
    this.deckService.getAllPlayerDecks().subscribe(playerDecks => {
      this.decks = playerDecks;
    });
    this.getAllFormats();
    this.resetValues();
  }

  selectDeck(deck: IDeck) {
    this.unsavedChanges = false;
    this.selectedDeck = deck;
    this.nomDeck = this.selectedDeck.nom;
    this.selectedFormat = deck.format;
    this.resetValues();
  }

  newDeck() {
    this.unsavedChanges = false;
    this.filtersAndSortsValues = {
      selectedClans: [],
      selectedTypes: [],
      selectedRaretes: [],
      sortValue: 'no'
    };
    const standardFormat = this.formats.find(format => format.nom === 'STANDARD');

    // Assigner le format "STANDARD" au nouveau deck
    if (standardFormat) {
      this.selectedFormat = standardFormat;
    }
    // @ts-ignore
    const user:IUtilisateur = this.authService.getUser();
    this.selectedDeck = {
      id: 0,
      nom:'',
      cartes:[],
      format: standardFormat ? standardFormat : this.nullFormat,
      utilisateur: user,
      dateCreation: new Date(Date.now())
    };

    this.nomDeck = '';
    this.hasExceededLimitation = false;
    this.resetValues();
  }

  addCarte(carte: ICarte) {
    if (this.selectedDeck && this.selectedFormat && this.selectedFormat.limitationCartes) {
      this.unsavedChanges = true;
      const limitation = this.selectedFormat.limitationCartes.find(limitation => limitation.carte.id === carte.id);
      const carteQuantity = this.selectedDeck.cartes.filter(c => c.id === carte.id).length;
      if (limitation) {
        const limitationQuantity = limitation.limite;
        if (carteQuantity >= limitationQuantity) {
          this.error = [
            {
              severity: 'warn',
              summary: 'Attention',
              detail: `Impossible d'ajouter la carte "${carte.nom}". La limitation de ${limitationQuantity} exemplaire(s) est déjà atteinte.`,
            },
          ];
          return;
        }
      } else if (this.selectedFormat.nom != 'NO LIMIT') {
        if (carteQuantity >= 3) {
          this.error = [
            {
              severity: 'warn',
              summary: 'Attention',
              detail: `Impossible d'ajouter la carte "${carte.nom}". La limitation de 3 exemplaires est déjà atteinte.`,
            },
          ];
          return;
        }
      }
    }

    if (this.selectedDeck && this.selectedDeck.cartes.length < 20) {
      this.selectedDeck.cartes.push(carte);
      this.removeSelectedCardFromUserCollection(carte);
    } else {
      this.error = [
        { severity: 'warn', summary: 'Attention', detail: 'Impossible de mettre plus de vingt cartes' },
      ];
    }
  }

  removeCard(carte: ICarte) {
    if (this.selectedDeck) {
      this.unsavedChanges = true;
      let indexCarte = this.selectedDeck.cartes.findIndex(card => card.id == carte.id);
      if (indexCarte >= 0) {
        this.selectedDeck.cartes.splice(indexCarte, 1);
      }
    }
    this.addSelectedCardToUserCollection(carte);
    this.checkLimitationsFormat();
  }

  saveDeck() {
    let deck: IDeck = this.selectedDeck;
    if (!this.nomDeck || this.nomDeck === '') {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans nom' },
      ];
    } else if (this.decks.some((existingDeck) => existingDeck.nom === this.nomDeck && existingDeck.id !== deck.id)) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Deux decks ne peuvent pas avoir le même nom' },
      ];
    } else if (!(deck.cartes.length == 20)) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Le deck doit comporter 20 cartes' },
      ];
    } else if (!this.selectedFormat) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans format' },
      ];
    } else if (this.hasExceededLimitation) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Ce deck n\'est pas valide pour ce format.' },
      ];
    } else {
      this.unsavedChanges = false;
      deck.nom = this.nomDeck;
      deck.format = this.selectedFormat;
      this.http.post<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deck', deck).subscribe(data => {
        this.deckService.getAllPlayerDecks().subscribe(playerDecks => {
          this.decks = playerDecks;
        });
      })
    }
  }

  duplicateDeck() {
    let deck = this.selectedDeck;
    if (!deck.nom) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans nom' },
      ];
    } else if (!(deck.cartes.length == 20)) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Le deck doit comporter 20 cartes' },
      ];
    } else if (!this.selectedFormat) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans format' },
      ];
    } else if (this.hasExceededLimitation) {
      this.error = [
        { severity: 'error', summary: 'Erreur', detail: 'Ce deck n\'est pas valide pour ce format.' },
      ];
    } else {
      // @ts-ignore
      const user:IUtilisateur = this.authService.getUser();
      // @ts-ignore
      let duplicatedDeck: IDeck = {
        id: 0,
        nom: deck.nom + '-dupl',
        cartes: [],
        utilisateur: user,
        format: this.selectedFormat,
        dateCreation: new Date(Date.now())
        }
      ;

      deck.cartes.forEach(carte => {
        // @ts-ignore
        duplicatedDeck.cartes.push(carte);
      });

      this.http.post<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deck', duplicatedDeck).subscribe(data => {
        this.deckService.getAllPlayerDecks().subscribe(playerDecks => {
          this.decks = playerDecks;
        });
      })
    }
  }


  getUserCollectionFiltered() {
    const url = `https://pampacardsback-57cce2502b80.herokuapp.com/api/collection?userId=${this.authService.getUserId()}`;
    this.collectionJoueur = [];
    this.collectionJoueurFiltree = [];
    this.http.get<ICollection>(url).subscribe({
      next: data => {
        if (data && data.cartes && data.cartes.length > 0) {
          // @ts-ignore
          if (!(this.authService.getUser().testeur && this.propertiesService.isTestModeOn())) {
            data.cartes = data.cartes.filter(carte => carte.released);
          }

          data.cartes.forEach(carte => {
            let indexCarte = this.collectionJoueur.findIndex(card => card.carte.id == carte.id);
            if (indexCarte >= 0) {
              this.collectionJoueur[indexCarte].quantity = this.collectionJoueur[indexCarte].quantity + 1;
            } else {
              this.collectionJoueur.push({carte: carte, quantity: 1});
            }
            this.collectionJoueurFiltree = this.collectionJoueur;
          });
        }
        let filtersAndSortsValues = {
          selectedClans: [],
          selectedTypes: [],
          selectedRaretes: [],
          sortValue: 'clan-asc'
        };
        this.applyFilters(filtersAndSortsValues);

        this.removeCartesCollectionDuSelectedDeck();
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    });
  }

  private getAllFormats() {
    this.http.get<IFormat[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/formats').subscribe({
      next: data => {
        data.forEach(format => this.formats.push(format));
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    })
  }

  delete() {
    let selectedDeck = this.selectedDeck;
    this.deckService.isDeckUtilise(selectedDeck).subscribe(
      (isUsed) => {
        if (isUsed) {
          this.error = [
            { severity: 'error', summary: 'Attention', detail: 'Impossible de supprimer un deck utilisé en tournoi / ligue' },
          ];
        } else {
          this.http.request('delete', 'https://pampacardsback-57cce2502b80.herokuapp.com/api/deck', { body: selectedDeck }).subscribe({
            next: data => {
              this.deckService.getAllPlayerDecks().subscribe(playerDecks => {
                this.decks = playerDecks;
              });
              // @ts-ignore
              this.selectedDeck = null;
              this.resetValues();
            },
            error: error => {
              this.error = [
                { severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression du deck' },
              ];
            }
          });
        }
      }
    );
  }


  private removeSelectedCardFromUserCollection(carte: ICarte) {
    let indexCarte = this.collectionJoueurFiltree.findIndex(card => card.carte.id == carte.id);
    if (indexCarte >= 0) {
      if (this.collectionJoueurFiltree[indexCarte].quantity > 1) {
        this.collectionJoueurFiltree[indexCarte].quantity = this.collectionJoueurFiltree[indexCarte].quantity - 1;
      } else if (this.collectionJoueurFiltree[indexCarte].quantity == 1) {
        this.collectionJoueurFiltree.splice(indexCarte, 1);
      }
    }
  }

  private addSelectedCardToUserCollection(carte: ICarte) {
    let indexCarte = this.collectionJoueurFiltree.findIndex(card => card.carte.id == carte.id);
    if (indexCarte >= 0) {
      this.collectionJoueurFiltree[indexCarte].quantity = this.collectionJoueurFiltree[indexCarte].quantity + 1;
    } else {
      this.collectionJoueurFiltree.push({carte: carte, quantity: 1});
    }
  }

  private removeCartesCollectionDuSelectedDeck() {
    this.selectedDeck?.cartes.forEach(carte => this.removeSelectedCardFromUserCollection(carte));
  }

  onFormatChange() {
    this.checkLimitationsFormat();
  }

  private checkLimitationsFormat() {
    if (this.selectedFormat && this.selectedFormat.limitationCartes) {
      const limitationCartes = this.selectedFormat.limitationCartes;

      this.hasExceededLimitation = false;

      limitationCartes.forEach((limitation: ILimitationCarte) => {
        const carteId = limitation.carte.id;
        const limitationQuantity = limitation.limite;

        const carteQuantity = this.selectedDeck.cartes.filter(carte => carte.id === carteId).length;

        if (carteQuantity > limitationQuantity) {
          this.hasExceededLimitation = true;
          const carteName = this.selectedDeck.cartes.find(carte => carte.id === carteId)?.nom;
          this.error = [
            {
              severity: 'error',
              summary: 'Erreur',
              detail: `La carte "${carteName}" dépasse la limitation de ${limitationQuantity} exemplaire(s) dans ce format.`,
            },
          ];
        }
      });
    }
  }

  applyFilters(filtersAndSortsValues: IFiltersAndSortsValues) {
    this.collectionJoueurFiltree = this.collectionJoueur.filter((carte: ICarteAndQuantity) => {
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
      this.collectionJoueurFiltree.sort((carteA, carteB) => {
        let value1;
        let value2;
        if (sortValue === 'clan-asc') {
          const clanComparison = carteA.carte.clan.nom.localeCompare(carteB.carte.clan.nom);
          if (clanComparison !== 0) {
            return clanComparison;
          } else {
            return carteA.carte.nom.localeCompare(carteB.carte.nom);
          }
        } else if (sortValue === 'clan-desc') {
          const clanComparison = carteB.carte.clan.nom.localeCompare(carteA.carte.clan.nom);
          if (clanComparison !== 0) {
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
          if (rareteComparison !== 0) {
            return rareteComparison;
          } else {
            return carteA.carte.nom.localeCompare(carteB.carte.nom);
          }
        } else if (sortValue === 'rarete-desc') {
          const rareteComparison = carteB.carte.rarete - carteA.carte.rarete;
          if (rareteComparison !== 0) {
            return rareteComparison;
          } else {
            return carteB.carte.nom.localeCompare(carteA.carte.nom);
          }
        } else if (sortValue === '') {
          value1 = carteA.carte.rarete;
          value2 = carteB.carte.rarete;
        } else if (sortValue === '') {
          value1 = carteB.carte.rarete;
          value2 = carteA.carte.rarete;
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
      this.collectionJoueurFiltree.sort((carteA, carteB) => {
        const clanComparison = carteA.carte.clan.nom.localeCompare(carteB.carte.clan.nom);
        if (clanComparison !== 0) {
          return clanComparison;
        } else {
          return carteA.carte.nom.localeCompare(carteB.carte.nom);
        }
      });
    }
  }

  private resetValues() {
    this.getUserCollectionFiltered();
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
}
