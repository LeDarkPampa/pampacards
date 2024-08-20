import {Component, OnInit} from '@angular/core';
import {IUtilisateur} from "../../interfaces/IUtilisateur";
import {IDeck} from "../../interfaces/IDeck";
import { HttpClient } from "@angular/common/http";
import {IUserPseudoAndCards} from "../../interfaces/IUserPseudoAndCards";
import {ReferentielService} from "../../services/referentiel.service";

@Component({
  selector: 'app-decks-base-details',
  templateUrl: './decks-base-details.component.html',
  styleUrls: ['./decks-base-details.component.css', '../../app.component.css']
})
export class DecksBaseDetailsComponent {
  utilisateurs: IUtilisateur[] = [];
  decksDeBase: IDeck[] = [];
  selectedUserName: string = '';
  pseudosUtilisateurs: string[] = [];

  // @ts-ignore
  deckSelectionne: IDeck;

  constructor(private http: HttpClient, private referentielService: ReferentielService) {
    this.referentielService.getAllUsers().subscribe({
      next: data => {
        this.utilisateurs = data;
        this.pseudosUtilisateurs = data.map(user => user.pseudo);
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des utilisateurs');
      }
    });

    this.referentielService.getDecksBase().subscribe({
      next: data => {
        this.decksDeBase = data;
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des decks');
      }
    });
  }

  selectionnerDeck(deck: IDeck) {
    this.deckSelectionne = deck;
  }
}
