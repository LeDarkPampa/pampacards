import { Component, OnInit } from '@angular/core';
import {Utilisateur} from "../../classes/Utilisateur";
import {Deck} from "../../classes/decks/Deck";
import { HttpClient } from "@angular/common/http";
import {ReferentielService} from "../../services/referentiel.service";
@Component({
  selector: 'app-attribution-deck',
  templateUrl: './attribution-deck.component.html',
  styleUrls: ['./attribution-deck.component.css', '../../app.component.css']
})
export class AttributionDeckComponent implements OnInit {
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

  ngOnInit() {

  }

  selectionnerDeck(deck: Deck) {
    this.deckSelectionne = deck;
  }

  ajouterCartesAuDeck() {
    if (this.selectedUserName) {
      let userPseudoAndCards = {
        pseudo: this.selectedUserName,
        cartes: [],
      };

      // @ts-ignore
      userPseudoAndCards.cartes.push(...this.deckSelectionne.cartes);

      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/addCartesToCollection', userPseudoAndCards).subscribe({
        next: () => {
          alert('Cartes ajoutées à la collection');
        },
        error: error => {
          console.error('There was an error!', error);
          alert('Erreur lors de la sauvegarde');
        }
      });
    }
  }
}
