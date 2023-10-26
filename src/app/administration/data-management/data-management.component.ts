import { Component } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.css', '../../app.component.css']
})
export class DataManagementComponent {

  constructor(private http: HttpClient) {

  }

  supprimerParties() {
    this.http.get<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deleteParties').subscribe({
      next: response => {
        alert('Parties supprimées');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la suppression');
      }
    });
  }

  supprimerTchatParties() {
    this.http.get<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/deleteTchatParties').subscribe({
      next: response => {
        alert('Historique supprimé');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la suppression');
      }
    });
  }
}
