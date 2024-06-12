import { Component } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {PropertiesService} from "../../services/properties.service";
import {IDeck} from "../../interfaces/IDeck";
import {IFormat} from "../../interfaces/IFormat";
import {ICarte} from "../../interfaces/ICarte";
import {ILimitationCarte} from "../../interfaces/ILimitationCarte";
import {DeckService} from "../../services/deck.service";

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.css', '../../app.component.css']
})
export class DataManagementComponent {

  private API_BASE_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';

  decks: IDeck[] = [];
  formats: IFormat[] = [];

  constructor(private http: HttpClient, private propertiesService: PropertiesService, private deckService: DeckService) {

  }

  ngOnInit() {
    this.getAllFormats();
    this.getAllDecks();
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

  updateProperties() {
    this.propertiesService.loadProperties();
  }

  updateDecks() {

    this.decks.forEach(deck => {
      deck.formats = [];
      this.formats.forEach(format => {
        if (this.deckService.validateDeck(deck, format) === null) {
          deck.formats.push(format);
        }
      })
    });

    this.http.post<IDeck[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/decks', this.decks).subscribe(data => {
      alert('Formats mis à jour');
    });
  }

  private getAllFormats() {
    this.http.get<IFormat[]>(`${this.API_BASE_URL}/formats`).subscribe({
      next: data => {
        this.formats = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des formats!', error);
      }
    });
  }

  private getAllDecks() {
    this.http.get<IDeck[]>(`${this.API_BASE_URL}/allDecks`).subscribe({
      next: data => {
        this.decks = data;
      },
      error: error => {
        console.error('Erreur lors de la récupération des formats!', error);
      }
    });
  }
}
