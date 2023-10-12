import {Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ICarte } from '../interfaces/ICarte';
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";
import {ICollection} from "../interfaces/ICollection";
import {AuthentificationService} from "../services/authentification.service";
import {PropertiesService} from "../services/properties.service";
import {ClanService} from "../services/clan.service";
import {TypeService} from "../services/type.service";

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit{

  collection: ICollection | undefined;
  cartes: ICarte[];
  cartesFiltrees: ICarte[] = [];

  private errorMessage: any;

  selectedClans: string[] = [];
  selectedTypes: string[] = [];
  selectedRaretes: number[] = [];
  clans: string[] = [];
  types: string[] = [];
  raretes: number[] = [1, 2, 3, 4];

  constructor(private http: HttpClient, private authService: AuthentificationService, private clanService: ClanService,
              private typeService: TypeService, private propertiesService: PropertiesService) {
    this.cartes = [];
    this.clanService.getAllClans().subscribe(
      (clans: IClan[]) => {
        clans.forEach((clan: IClan) => this.clans.push(clan.nom));
      },
      (error) => {
        this.errorMessage = error;
      }
    );
    this.typeService.getAllTypes().subscribe(
      (types: IType[]) => {
        types.forEach((type: IType) => this.types.push(type.nom));
      },
      (error) => {
        this.errorMessage = error;
      }
    );
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

  applyFilters() {
    this.cartesFiltrees = this.cartes.filter((carte: ICarte) => {
      if (this.selectedClans && this.selectedClans.length > 0 && this.selectedClans.indexOf(carte.clan.nom) == -1) {
        return false;
      }
      if (this.selectedTypes && this.selectedTypes.length > 0 && this.selectedTypes.indexOf(carte.type.nom) == -1) {
        return false;
      }
      return !(this.selectedRaretes && this.selectedRaretes.length > 0 && this.selectedRaretes.indexOf(carte.rarete) == -1);
    });
  }

  sort(critere: string) {
    this.cartesFiltrees.sort((carteA, carteB) => {
      let value1;
      let value2;
      if (critere === 'nom') {
        value1 = carteA.nom;
        value2 = carteB.nom;
      } else if (critere === 'rarete') {
        value1 = carteA.rarete;
        value2 = carteB.rarete;
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
  resetFilters() {
    this.selectedClans = [];
    this.selectedTypes = [];
    this.selectedRaretes = [];
    this.applyFilters();
  }
}
