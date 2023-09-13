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

  constructor(private http: HttpClient) {
    this.getAllCollection();
  }

  saveChanges() {
    // Enregistrez les modifications dans la base de données ou effectuez toute autre action nécessaire.
    // Vous pouvez envoyer les données mises à jour au backend ici.
  }

  getAllCollection() {
    this.http.get<ICarte[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/cartes').subscribe({
      next: (data: ICarte[]) => {
        this.cartes = data;
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
}
