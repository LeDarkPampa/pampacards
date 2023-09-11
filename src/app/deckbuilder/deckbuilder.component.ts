import { Component, OnInit } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";
import {HttpClient} from "@angular/common/http";
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";
import {IDeck} from "../interfaces/IDeck";
import {ICollection} from "../interfaces/ICollection";
import {AuthentificationService} from "../services/authentification.service";
import {ICarteAndQuantity} from "../interfaces/ICarteAndQuantity";
import {IFormat} from "../interfaces/IFormat";
import {ILimitationCarte} from "../interfaces/ILimitationCarte";

@Component({
  selector: 'app-deckbuilder',
  templateUrl: './deckbuilder.component.html',
  styleUrls: ['./deckbuilder.component.css']
})
export class DeckbuilderComponent implements OnInit {

  private errorMessage: any;
  collectionJoueur: ICarteAndQuantity[];

  decks: IDeck[] = [];

  formats: IFormat[] = [];

  // @ts-ignore
  selectedDeck: IDeck;

  // @ts-ignore
  selectedFormat: IFormat;

  // Filtres
  selectedClans: string[] = [];
  selectedTypes: string[] = [];
  selectedRaretes: number[] = [];

  clans: String[] = [];
  types: String[] = [];
  raretes: number[] = [1, 2, 3, 4];

  selectedClass = 'selected';
  nullFormat = {
      formatId: 0,
      nom: '',
      limitationCartes: []
  }
  // @ts-ignore
  error: Message[];
  // @ts-ignore
  hasExceededLimitation: Boolean;

  constructor(private http: HttpClient, private authService: AuthentificationService) {
    this.collectionJoueur = [];
    this.getAllClans();
    this.getAllTypes();
  }

  ngOnInit() {
    this.getAllPlayerDecks();
    this.getAllFormats();
    this.resetFilters();
  }

  selectDeck(deck: IDeck) {
    this.selectedDeck = deck;
    this.selectedFormat = deck.format;
    this.resetFilters();
  }

  newDeck() {
    this.getUserCollection(this.authService.userId);
    const standardFormat = this.formats.find(format => format.nom === 'STANDARD');

    // Assigner le format "STANDARD" au nouveau deck
    if (standardFormat) {
      this.selectedFormat = standardFormat;
    }
    this.selectedDeck = {
      id: 0,
      nom:'',
      cartes:[],
      format: standardFormat ? standardFormat : this.nullFormat,
      utilisateur: this.authService.user,
      dateCreation: new Date(Date.now())
    };
    this.hasExceededLimitation = false;
    this.resetFilters();
  }

  addCarte(carte: ICarte) {
    if (this.selectedDeck && this.selectedFormat && this.selectedFormat.limitationCartes) {
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
      let indexCarte = this.selectedDeck.cartes.findIndex(card => card.id == carte.id);
      if (indexCarte >= 0) {
        this.selectedDeck.cartes.splice(indexCarte, 1);
      }
    }
    this.addSelectedCardToUserCollection(carte);
    this.checkLimitationsFormat();
  }

  getAllPlayerDecks() {
    this.http.get<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/decks?userId='+this.authService.userId).subscribe({
      next: data => {
        this.decks = data.sort(function(a, b){
          const date1 = new Date(a.dateCreation);
          const date2 = new Date(b.dateCreation);
          return date1.valueOf() - date2.valueOf();
        });
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    });
  }

  saveDeck(deck: IDeck) {
    if (!deck.nom) {
      this.error = [
        { severity: 'error', summary: 'Error', detail: 'Impossible de sauvegarder un deck sans nom' },
      ];
    } else if (!(deck.cartes.length == 20)) {
      this.error = [
        { severity: 'error', summary: 'Error', detail: 'Le deck doit comporter 20 cartes' },
      ];
    } else if (!this.selectedFormat) {
      this.error = [
        { severity: 'error', summary: 'Error', detail: 'Impossible de sauvegarder un deck sans format' },
      ];
    } else if (this.hasExceededLimitation) {
      this.error = [
        { severity: 'error', summary: 'Error', detail: 'Ce deck n\'est pas valide pour ce format.' },
      ];
    } else {
      deck.format = this.selectedFormat;
      this.http.post<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deck', deck).subscribe(data => {
        this.getAllPlayerDecks();
      })
    }
  }

  duplicateDeck(deck: IDeck) {
    if (!deck.nom) {
      this.error = [
        { severity: 'error', summary: 'Error', detail: 'Impossible de sauvegarder un deck sans nom' },
      ];
    } else if (!(deck.cartes.length == 20)) {
      this.error = [
        { severity: 'error', summary: 'Error', detail: 'Le deck doit comporter 20 cartes' },
      ];
    } else {
      let duplicatedDeck = {
        id: 0,
        nom: deck.nom,
        cartes: [],
        utilisateur: this.authService.user,
        dateCreation: new Date(Date.now())
      };

      deck.cartes.forEach(carte => {
        // @ts-ignore
        duplicatedDeck.cartes.push(carte);
      });

      this.http.post<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deck', duplicatedDeck).subscribe(data => {
        this.getAllPlayerDecks();
      })
    }
  }

  getUserCollection(userId: number) {
    const url = `https://pampacardsback-57cce2502b80.herokuapp.com/api/collection?userId=${userId}`;
    this.collectionJoueur = [];
    this.http.get<ICollection>(url).subscribe({
      next: data => {

        if (data && data.cartes && data.cartes.length > 0) {
          data.cartes.forEach(carte => {
            let indexCarte = this.collectionJoueur.findIndex(card => card.carte.id == carte.id);
            if (indexCarte >= 0) {
              this.collectionJoueur[indexCarte].quantity = this.collectionJoueur[indexCarte].quantity + 1;
            } else {
              this.collectionJoueur.push({carte: carte, quantity: 1});
            }
          });
        }

        this.removeCartesCollectionDuSelectedDeck();
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    });
  }

  applyFilters() {
    this.getUserCollectionFiltered(this.authService.userId);
  }

  sort(critere: string) {
    this.collectionJoueur.sort((carteA, carteB) => {
      let value1;
      let value2;
      if (critere === 'nom') {
        value1 = carteA.carte.nom;
        value2 = carteB.carte.nom;
      } else if (critere === 'rarete') {
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
  }

  getUserCollectionFiltered(userId: number) {
    const url = `https://pampacardsback-57cce2502b80.herokuapp.com/api/collection?userId=${userId}`;
    this.collectionJoueur = [];
    this.http.get<ICollection>(url).subscribe({
      next: data => {

        if (data && data.cartes && data.cartes.length > 0) {
          data.cartes.forEach(carte => {
            let indexCarte = this.collectionJoueur.findIndex(card => card.carte.id == carte.id);
            if (indexCarte >= 0) {
              this.collectionJoueur[indexCarte].quantity = this.collectionJoueur[indexCarte].quantity + 1;
            } else {
              this.collectionJoueur.push({carte: carte, quantity: 1});
            }
          });
        }

        this.removeCartesCollectionDuSelectedDeck();

        this.collectionJoueur = this.collectionJoueur.filter((carte: ICarteAndQuantity) => {
          if (this.selectedClans && this.selectedClans.length > 0 && this.selectedClans.indexOf(carte.carte.clan.nom) == -1) {
            return false;
          }

          if (this.selectedTypes && this.selectedTypes.length > 0 && this.selectedTypes.indexOf(carte.carte.type.nom) == -1) {
            return false;
          }

          return !(this.selectedRaretes && this.selectedRaretes.length > 0 && this.selectedRaretes.indexOf(carte.carte.rarete) == -1);
        });
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    });
  }

  getAllClans() {
    this.http.get<IClan[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/clans').subscribe({
      next: data => {
        data.forEach(clan => this.clans.push(clan.nom));
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    })
  }

  private getAllTypes() {
    this.http.get<IType[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/types').subscribe({
      next: data => {
        data.forEach(type => this.types.push(type.nom));
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    })
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

  delete(selectedDeck: IDeck) {
    this.http.request('delete', 'https://pampacardsback-57cce2502b80.herokuapp.com/api/deck', {body: selectedDeck}).subscribe({
      next: data => {
        this.getAllPlayerDecks();
        // @ts-ignore
        this.selectedDeck = null;
        this.resetFilters();
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    });
  }


  private removeSelectedCardFromUserCollection(carte: ICarte) {
    let indexCarte = this.collectionJoueur.findIndex(card => card.carte.id == carte.id);
    if (indexCarte >= 0) {
      if (this.collectionJoueur[indexCarte].quantity > 1) {
        this.collectionJoueur[indexCarte].quantity = this.collectionJoueur[indexCarte].quantity - 1;
      } else if (this.collectionJoueur[indexCarte].quantity == 1) {
        this.collectionJoueur.splice(indexCarte, 1);
      }
    }
  }

  private addSelectedCardToUserCollection(carte: ICarte) {
    let indexCarte = this.collectionJoueur.findIndex(card => card.carte.id == carte.id);
    if (indexCarte >= 0) {
      this.collectionJoueur[indexCarte].quantity = this.collectionJoueur[indexCarte].quantity + 1;
    } else {
      this.collectionJoueur.push({carte: carte, quantity: 1});
    }
  }

  resetFilters() {
    this.selectedClans = [];
    this.selectedTypes = [];
    this.selectedRaretes = [];
    this.applyFilters();
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

  isCarteExceedsLimitation(carteId: number): boolean {
    if (this.selectedDeck && this.selectedFormat && this.selectedFormat.limitationCartes) {
      const limitation = this.selectedFormat.limitationCartes.find(limitation => limitation.carte.id === carteId);
      const carteQuantity = this.selectedDeck.cartes.filter(carte => carte.id === carteId).length;
      if (limitation) {
        return carteQuantity > limitation.limite;
      } else if (this.selectedFormat.nom != 'NO LIMIT') {
        return carteQuantity > 3;
      }
    }
    return false;
  }
}
