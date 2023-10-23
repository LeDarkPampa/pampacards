import {Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ICarte } from '../interfaces/ICarte';
import {ICollection} from "../interfaces/ICollection";
import {AuthentificationService} from "../services/authentification.service";
import {PropertiesService} from "../services/properties.service";
import {ClanService} from "../services/clan.service";
import {TypeService} from "../services/type.service";
import {IFiltersAndSortsValues} from "../interfaces/IFiltersAndSortsValues";

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css', '../app.component.css']
})
export class CollectionComponent implements OnInit{

  collection: ICollection | undefined;
  cartes: ICarte[];
  cartesFiltrees: ICarte[] = [];

  private errorMessage: any;

  constructor(private http: HttpClient, private authService: AuthentificationService, private clanService: ClanService,
              private typeService: TypeService, private propertiesService: PropertiesService) {
    this.cartes = [];
    this.getAllCollection();
  }

  ngOnInit() {
    this.getUserCollection(this.authService.userId);
  }

  getAllCollection() {
    if (this.authService.user.testeur && this.propertiesService.isTestModeOn()) {
      this.http.get<ICarte[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/testCartes').subscribe({
        next: data => {
          if (this.authService.user.testeur && this.propertiesService.isTestModeOn()) {
            this.cartes = data;
          } else {
            this.cartes = data.filter(carte => carte.released);
          }

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
    } else {
      this.http.get<ICarte[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/cartes').subscribe({
        next: data => {
          if (this.authService.user.testeur && this.propertiesService.isTestModeOn()) {
            this.cartes = data;
          } else {
            this.cartes = data.filter(carte => carte.released);
          }

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
  }

  getUserCollection(userId: number) {
    const url = `https://pampacardsback-57cce2502b80.herokuapp.com/api/collection?userId=${userId}`;

    this.http.get<ICollection>(url).subscribe({
      next: data => {
        if (!(this.authService.user.testeur && this.propertiesService.isTestModeOn())) {
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

  isInCollection(carte: ICarte) {
    return this.collection?.cartes.some(card => card.id === carte.id);
  }

  countNumberInUserCollection(carte: ICarte): number {
    return this.collection ? this.collection?.cartes.filter(card => card.id === carte.id).length : 0;
  }

  applyFilters(filtersAndSortsValues: IFiltersAndSortsValues) {
    this.cartesFiltrees = this.cartes.filter((carte: ICarte) => {
      if (filtersAndSortsValues.selectedClans && filtersAndSortsValues.selectedClans.length > 0
        && filtersAndSortsValues.selectedClans.indexOf(carte.clan.nom) == -1) {
        return false;
      }
      if (filtersAndSortsValues.selectedTypes && filtersAndSortsValues.selectedTypes.length > 0
        && filtersAndSortsValues.selectedTypes.indexOf(carte.type.nom) == -1) {
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
    }
  }
}
