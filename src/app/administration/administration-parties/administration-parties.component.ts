import { Component } from '@angular/core';
import {IPartie} from "../../interfaces/IPartie";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {IResultatPartie} from "../../interfaces/IResultatPartie";

@Component({
  selector: 'app-administration-parties',
  templateUrl: './administration-parties.component.html',
  styleUrls: ['./administration-parties.component.css', '../../app.component.css']
})
export class AdministrationPartiesComponent {

  // @ts-ignore
  partiesEnCours: IPartie[];
  // @ts-ignore
  resultatsParties: IResultatPartie[];

  constructor(private http: HttpClient, private router: Router) {
    this.http.get<IPartie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partiesEnCours').subscribe({
      next: data => {
        this.partiesEnCours = data;
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des parties en cours');
      }
    });

    this.http.get<IPartie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/resultatsPartiesTerminees').subscribe({
      next: data => {
        this.partiesEnCours = data;
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des parties en cours');
      }
    });
  }

  observerPartie(partieId: number) {
    this.router.navigate(['/partie-obs', partieId]);
  }
}
