import {Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Collection} from "../classes/Collection";
import {AuthentificationService} from "../services/authentification.service";
import {PropertiesService} from "../services/properties.service";
import {FiltersAndSortsValues} from "../classes/FiltersAndSortsValues";
import {ReferentielService} from "../services/referentiel.service";
import {UtilisateurService} from "../services/utilisateur.service";
import {Carte} from "../classes/cartes/Carte";

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css', '../app.component.css']
})
export class CollectionComponent implements OnInit {

  collection: Collection | undefined;
  cartes: Carte[];
  cartesFiltrees: Carte[] = [];
  // @ts-ignore
  filters: FiltersAndSortsValues;

  private errorMessage: any;
  filtrerCartesPossedees: boolean = false;
  filtrerCartesExtension: boolean = false;

  constructor(private http: HttpClient, private authService: AuthentificationService,
              private propertiesService: PropertiesService, private referentielService: ReferentielService,
              private utilisateurService: UtilisateurService) {
    this.cartes = [];
    this.getAllCollection();
  }

  ngOnInit() {
    this.getUserCollection(this.authService.getUserId());
    this.filters = {
      selectedClans: [],
      selectedTypes: [],
      selectedRaretes: [],
      sortValue: 'no'
    }
  }

  getAllCollection() {
    this.referentielService.getAllCartes().subscribe({
      next: data => {
        this.cartes = data;

        this.cartesFiltrees = data;

        this.cartesFiltrees.sort((carteA, carteB) => {
          let value1;
          let value2;
          value1 = carteA.clan.nom;
          value2 = carteB.clan.nom;
          if (value1 < value2) {
            return -1;
          }
          if (value1 > value2) {
            return 1;
          }
          return 0;
        });
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    })
  }

  getUserCollection(userId: number) {
    this.utilisateurService.getCollection(userId).subscribe({
      next: data => {
        // @ts-ignore
        if (!(this.authService.getUser().testeur && this.propertiesService.isTestModeOn())) {
          data.cartes = data.cartes.filter(carte => carte.released);
        }
        this.collection = data;
      },
      error: error => {
        this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    });
  }

  isInCollection(carte: Carte) {
    return this.collection?.cartes.some(card => card.id === carte.id);
  }

  countNumberInUserCollection(carte: Carte): number {
    return this.collection ? this.collection?.cartes.filter(card => card.id === carte.id).length : 0;
  }

  applyFilters(filtersAndSortsValues: FiltersAndSortsValues) {
    this.filters = filtersAndSortsValues;
    this.cartesFiltrees = this.cartes.filter((carte: Carte) => {
      if (filtersAndSortsValues.selectedClans && filtersAndSortsValues.selectedClans.length > 0
        && filtersAndSortsValues.selectedClans.indexOf(carte.clan.nom) == -1) {
        return false;
      }
      if (filtersAndSortsValues.selectedTypes && filtersAndSortsValues.selectedTypes.length > 0
        && filtersAndSortsValues.selectedTypes.indexOf(carte.type.nom) == -1) {
        return false;
      }

      if (this.filtrerCartesPossedees && !this.isInCollection(carte)) {
        return false;
      }

      if (this.filtrerCartesExtension && carte.released) {
        return false;
      }

      return !(filtersAndSortsValues.selectedRaretes && filtersAndSortsValues.selectedRaretes.length > 0
        && filtersAndSortsValues.selectedRaretes.indexOf(carte.rarete) == -1);
    });
    this.sortCards(filtersAndSortsValues.sortValue);
  }

  sortCards(sortValue: string) {
    if (sortValue != '' && sortValue != 'no') {
      this.cartesFiltrees.sort((carteA, carteB) => {
        let value1;
        let value2;
        if (sortValue === 'clan-asc') {
          const clanComparison = carteA.clan.nom.localeCompare(carteB.clan.nom);
          if (clanComparison !== 0) {
            return clanComparison;
          } else {
            return carteA.nom.localeCompare(carteB.nom);
          }
        } else if (sortValue === 'clan-desc') {
          const clanComparison = carteB.clan.nom.localeCompare(carteA.clan.nom);
          if (clanComparison !== 0) {
            return clanComparison;
          } else {
            return carteB.nom.localeCompare(carteA.nom);
          }
        } else if (sortValue === 'nom-asc') {
          value1 = carteA.nom;
          value2 = carteB.nom;
        } else if (sortValue === 'nom-desc') {
          value1 = carteB.nom;
          value2 = carteA.nom;
        } else if (sortValue === 'rarete-asc') {
          const rareteComparison = carteA.rarete - carteB.rarete;
          if (rareteComparison !== 0) {
            return rareteComparison;
          } else {
            return carteA.nom.localeCompare(carteB.nom);
          }
        } else if (sortValue === 'rarete-desc') {
          const rareteComparison = carteB.rarete - carteA.rarete;
          if (rareteComparison !== 0) {
            return rareteComparison;
          } else {
            return carteB.nom.localeCompare(carteA.nom);
          }
        } else if (sortValue === '') {
          value1 = carteA.rarete;
          value2 = carteB.rarete;
        } else if (sortValue === '') {
          value1 = carteB.rarete;
          value2 = carteA.rarete;
        } else {
          value1 = carteA.nom;
          value2 = carteB.nom;
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
      this.cartesFiltrees.sort((carteA, carteB) => {
        const clanComparison = carteA.clan.nom.localeCompare(carteB.clan.nom);
        if (clanComparison !== 0) {
          return clanComparison;
        } else {
          return carteA.nom.localeCompare(carteB.nom);
        }
      });
    }
  }

  filtrerDonnees() {
    if (this.filtrerCartesPossedees) {
      this.cartesFiltrees = this.cartesFiltrees.filter(carte => this.isInCollection(carte));
      if (this.filtrerCartesExtension) {
       this.cartesFiltrees = this.cartesFiltrees.filter(carte => !carte.released);
      }
    } else {
      if (this.filtrerCartesExtension) {
        this.cartesFiltrees = this.cartesFiltrees.filter(carte => !carte.released);
      }
      this.applyFilters(this.filters);
    }
  }

  isUserTest() {
    return this.authService.getUser()?.testeur;
  }
}
