import { Component, OnInit } from '@angular/core';
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {IDeck} from "../interfaces/IDeck";
import {HttpClient} from "@angular/common/http";
@Component({
  selector: 'app-attribution-deck',
  templateUrl: './attribution-deck.component.html',
  styleUrls: ['./attribution-deck.component.css']
})
export class AttributionDeckComponent implements OnInit {
  utilisateurs: IUtilisateur[] = [];
  decksDeBase: IDeck[] = [];
  selectedUserName: string = '';
  pseudosUtilisateurs: string[] = [];
  // @ts-ignore
  utilisateurSelectionne: IUtilisateur;

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
    // Ajoutez les cartes du deck sélectionné à l'utilisateur sélectionné.
  }
}
