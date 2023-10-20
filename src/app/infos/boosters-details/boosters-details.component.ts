import { Component } from '@angular/core';
import {IBooster} from "../../interfaces/IBooster";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-boosters-details',
  templateUrl: './boosters-details.component.html',
  styleUrls: ['./boosters-details.component.css', '../../app.component.css']
})
export class BoostersDetailsComponent {

  boosters: IBooster[] = [];
  // @ts-ignore
  boosterSelectionne: IBooster;

  constructor(private http: HttpClient) {
    this.http.get<IBooster[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/boosters').subscribe({
      next: data => {
        this.boosters = data;
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des decks');
      }
    });
  }

  selectionnerBooster(booster: IBooster) {
    this.boosterSelectionne = booster;
  }

}
