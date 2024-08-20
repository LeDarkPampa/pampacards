import { Component, OnInit } from '@angular/core';
import {IUtilisateur} from "../../interfaces/IUtilisateur";
import {IDeck} from "../../interfaces/IDeck";
import { HttpClient } from "@angular/common/http";
import {IUserPseudoAndCards} from "../../interfaces/IUserPseudoAndCards";
import {ReferentielService} from "../../services/referentiel.service";
@Component({
  selector: 'app-attribution-deck',
  templateUrl: './attribution-deck.component.html',
  styleUrls: ['./attribution-deck.component.css', '../../app.component.css']
})
export class AttributionDeckComponent implements OnInit {
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

  ngOnInit() {

  }

  selectionnerDeck(deck: IDeck) {
    this.deckSelectionne = deck;
  }

  ajouterCartesAuDeck() {
    if (this.selectedUserName) {
      let userPseudoAndCards: IUserPseudoAndCards = {
        pseudo: this.selectedUserName,
        cartes: [],
      };

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
