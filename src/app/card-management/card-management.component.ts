import { Component } from '@angular/core';
import { ICarte } from '../interfaces/ICarte';
import { IClan } from '../interfaces/IClan';
import { IType } from '../interfaces/IType';
import { HttpClient } from '@angular/common/http';
import { IEffet } from '../interfaces/IEffet'; // Assurez-vous d'importer IEffet

@Component({
  selector: 'app-card-management',
  templateUrl: './card-management.component.html',
  styleUrls: ['./card-management.component.css']
})
export class CardManagementComponent {
  cartes: ICarte[] = [];
  clans: IClan[] = [];
  types: IType[] = [];
  effets: IEffet[] = [];
  selectedSort: string = 'clan';
  sortDirection: number = 1;

  constructor(private http: HttpClient) {
    this.getAllCollection();
    this.sortCards();
  }

  saveChanges() {
    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/updateCartes', this.cartes).subscribe({
      next: () => {
        alert('Cartes mises à jour');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la sauvegarde');
      }
    });
  }

  getAllCollection() {
    this.http.get<ICarte[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/cartes').subscribe({
      next: (data: ICarte[]) => {
        this.cartes = data;
        this.sortCards();
      },
      error: error => {
        console.error('Erreur lors de la récupération des cartes', error);
      }
    });

    this.http.get<IClan[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/clans').subscribe({
      next: (data: IClan[]) => {
        this.clans = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des clans', error);
      }
    });

    this.http.get<IType[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/types').subscribe({
      next: (data: IType[]) => {
        this.types = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des types', error);
      }
    });

    this.http.get<IEffet[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/effets').subscribe({
      next: (data: IEffet[]) => {
        this.effets = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des effets', error);
      }
    });
  }

  compareEffets(effet1: IEffet, effet2: IEffet): boolean {
    if (!effet1 && !effet2) {
      return true;
    } else if (!effet1 || !effet2) {
      return false;
    } else {
      return effet1.id === effet2.id;
    }
  }

  sortCards() {
    this.cartes.sort((a, b) => {
      let compareValueA, compareValueB;

      switch (this.selectedSort) {
        case 'clan':
          compareValueA = a.clan.nom;
          compareValueB = b.clan.nom;
          break;
        case 'type':
          compareValueA = a.type.nom;
          compareValueB = b.type.nom;
          break;
        case 'nom':
          compareValueA = a.nom;
          compareValueB = b.nom;
          break;
        default:
          // Par défaut, tri par clan
          compareValueA = a.clan.nom;
          compareValueB = b.clan.nom;
          break;
      }

      if (compareValueA < compareValueB) {
        return -this.sortDirection;
      } else if (compareValueA > compareValueB) {
        return this.sortDirection;
      } else {
        return 0;
      }
    });
  }

  getContinuValue(carte: ICarte): string {
    if (carte.effet && carte.effet.continu) {
      return "Oui";
    } else {
      return "Non";
    }
  }
}
