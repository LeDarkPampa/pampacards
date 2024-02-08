import { Component, OnInit } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";
import {HttpClient} from "@angular/common/http";
import {IDeck} from "../interfaces/IDeck";
import {ICollection} from "../interfaces/ICollection";
import {AuthentificationService} from "../services/authentification.service";
import {ICarteAndQuantity} from "../interfaces/ICarteAndQuantity";
import {IFormat} from "../interfaces/IFormat";
import {ILimitationCarte} from "../interfaces/ILimitationCarte";
import {IFiltersAndSortsValues} from "../interfaces/IFiltersAndSortsValues";
import {DeckService} from "../services/deck.service";
import {CanComponentDeactivate} from "../interfaces/CanComponentDeactivate";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {PropertiesService} from "../services/properties.service";

@Component({
  selector: 'app-deckbuilder',
  templateUrl: './deckbuilder.component.html',
  styleUrls: ['./deckbuilder.component.css', '../app.component.css']
})
export class DeckbuilderComponent implements OnInit, CanComponentDeactivate {

  unsavedChanges = false;
  collectionJoueur: ICarteAndQuantity[];
  collectionJoueurFiltree: ICarteAndQuantity[];
  collectionJoueurFiltreeTriee: ICarteAndQuantity[];
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
  message: Message[];
  // @ts-ignore
  hasExceededLimitation: Boolean;
  filtersAndSortsValues: IFiltersAndSortsValues = {
    selectedClans: [],
    selectedTypes: [],
    selectedRaretes: [],
    sortValue: 'no'
  };

  constructor(private http: HttpClient, private authService: AuthentificationService,
              private deckService: DeckService, private propertiesService: PropertiesService) {
    this.collectionJoueur = [];
    this.collectionJoueurFiltree = [];
    this.collectionJoueurFiltreeTriee = [];
  }

  ngOnInit() {
    this.collectionJoueurFiltree = [];
    this.collectionJoueurFiltreeTriee = [];
    this.deckService.getAllPlayerDecks().subscribe(playerDecks => {
      this.decks = playerDecks;
      this.getAllFormats();
      this.getUserCollectionFiltered();
    });
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
          this.message = [
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
          this.message = [
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

    const standardFormat = this.selectedFormat.nom === 'STANDARD';
    // Format standard : 3 cartes 4* max
    if (standardFormat && carte.rarete === 4) {
      let nb4Etoiles = 0;
      for (const c of this.selectedDeck.cartes) {
        if (c.rarete === 4) {
          nb4Etoiles ++;
        }
      }
      if (nb4Etoiles >= 3) {
        this.message = [
          {
            severity: 'error',
            summary: 'Erreur',
            detail: `Votre deck ne peut contenir que 3 cartes 4* dans ce format.`,
          },
        ];
        return;
      }
    }

    if (this.selectedDeck && this.selectedDeck.cartes.length < 20) {
      this.selectedDeck.cartes.push(carte);
      this.refreshCollectionFiltered();
    } else {
      this.message = [
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
      this.refreshCollectionFiltered();
    }
  }

  saveDeck() {
    let deck: IDeck = this.selectedDeck;
    if (!this.nomDeck || this.nomDeck === '') {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans nom' },
      ];
    } else if (this.decks.some((existingDeck) => existingDeck.nom === this.nomDeck && existingDeck.id != deck.id)) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Deux decks ne peuvent pas avoir le même nom' },
      ];
    } else if (!(deck.cartes.length == 20)) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Le deck doit comporter 20 cartes' },
      ];
    } else if (!this.selectedFormat) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans format' },
      ];
    } else if (this.hasExceededLimitation) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Ce deck n\'est pas valide pour ce format.' },
      ];
    } else {
      this.unsavedChanges = false;
      deck.nom = this.nomDeck;
      deck.format = this.selectedFormat;
      this.http.post<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deck', deck).subscribe(data => {
        this.deckService.getAllPlayerDecks().subscribe(playerDecks => {
          this.decks = playerDecks;
          this.message = [
            { severity: 'success', summary: 'Sauvegarde', detail: 'Deck sauvegardé' },
          ];
        });
      })
    }
  }

  duplicateDeck() {
    let deck = this.selectedDeck;
    if (!deck.nom) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans nom' },
      ];
    } else if (!(deck.cartes.length == 20)) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Le deck doit comporter 20 cartes' },
      ];
    } else if (!this.selectedFormat) {
      this.message = [
        { severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder un deck sans format' },
      ];
    } else if (this.hasExceededLimitation) {
      this.message = [
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
    this.http.get<ICollection>(url).subscribe({
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
      },
      error: error => {
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
        console.error('There was an error!', error);
      }
    })
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
              this.message = [
                { severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression du deck' },
              ];
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
    this.checkLimitationsFormat();
  }

  private checkLimitationsFormat() {
    if (this.selectedFormat && this.selectedFormat.limitationCartes) {

      this.hasExceededLimitation = false;

      const limitationCartes = this.selectedFormat.limitationCartes;

      const standardFormat = this.selectedFormat.nom === 'STANDARD';

      // Format standard : 3 cartes 4* max
      if (standardFormat) {
        let nb4Etoiles = 0;
        for (const carte of this.selectedDeck.cartes) {
          if (carte.rarete === 4) {
            nb4Etoiles ++;
          }

          if (nb4Etoiles >= 4) {
            this.message = [
              {
                severity: 'error',
                summary: 'Erreur',
                detail: `Votre deck ne peut contenir que 3 cartes 4* dans ce format.`,
              },
            ];
            this.hasExceededLimitation = true;
          }
        }
      }

      limitationCartes.forEach((limitation: ILimitationCarte) => {
        const carteId = limitation.carte.id;
        const limitationQuantity = limitation.limite;

        const carteQuantity = this.selectedDeck.cartes.filter(carte => carte.id === carteId).length;

        if (carteQuantity > limitationQuantity) {
          this.hasExceededLimitation = true;
          const carteName = this.selectedDeck.cartes.find(carte => carte.id === carteId)?.nom;
          this.message = [
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
    this.collectionJoueurFiltreeTriee = this.collectionJoueurFiltree.filter((carte: ICarteAndQuantity) => {
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

  private deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }
}
