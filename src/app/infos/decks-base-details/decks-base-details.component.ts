import {Component, OnInit} from '@angular/core';
import {IUtilisateur} from "../../interfaces/IUtilisateur";
import {IDeck} from "../../interfaces/IDeck";
import {HttpClient} from "@angular/common/http";
import {IUserPseudoAndCards} from "../../interfaces/IUserPseudoAndCards";

@Component({
  selector: 'app-decks-base-details',
  templateUrl: './decks-base-details.component.html',
  styleUrls: ['./decks-base-details.component.css', '../../app.component.css']
})
export class DecksBaseDetailsComponent implements OnInit {
  utilisateurs: IUtilisateur[] = [];
  decksDeBase: IDeck[] = [];
  selectedUserName: string = '';
  pseudosUtilisateurs: string[] = [];

  // @ts-ignore
  deckSelectionne: IDeck;

  constructor(private http: HttpClient) {
    this.http.get<IUtilisateur[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/users').subscribe({
      next: data => {
        this.utilisateurs = data;
        this.pseudosUtilisateurs = data.map(user => user.pseudo);
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des utilisateurs');
      }
    });

    this.http.get<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/decks-base').subscribe({
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
