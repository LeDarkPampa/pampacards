import {Component} from '@angular/core';
import {Utilisateur} from "../../classes/Utilisateur";
import {Deck} from "../../classes/decks/Deck";
import { HttpClient } from "@angular/common/http";
import {ReferentielService} from "../../services/referentiel.service";

@Component({
  selector: 'app-decks-base-details',
  templateUrl: './decks-base-details.component.html',
  styleUrls: ['./decks-base-details.component.css', '../../app.component.css']
})
export class DecksBaseDetailsComponent {
  utilisateurs: Utilisateur[] = [];
  decksDeBase: Deck[] = [];
  selectedUserName: string = '';
  pseudosUtilisateurs: string[] = [];

  // @ts-ignore
  deckSelectionne: Deck;

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

  selectionnerDeck(deck: Deck) {
    this.deckSelectionne = deck;
  }
}
