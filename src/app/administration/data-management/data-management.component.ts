import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PropertiesService } from '../../services/properties.service';
import { Deck } from '../../classes/decks/Deck';
import { Format } from '../../classes/decks/Format';
import { DeckService } from '../../services/deck.service';
import { catchError, defaultIfEmpty } from 'rxjs/operators';
import { of } from 'rxjs';
import {ReferentielService} from "../../services/referentiel.service";

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.css', '../../app.component.css']
})
export class DataManagementComponent implements OnInit {

  private readonly API_BASE_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';

  decks: Deck[] = [];
  formats: Format[] = [];

  constructor(
    private http: HttpClient,
    private propertiesService: PropertiesService,
    private deckService: DeckService,
    private referentielService: ReferentielService
  ) {}

  ngOnInit(): void {
    this.getAllFormats();
    this.getAllDecks();
  }

  supprimerParties(): void {
    this.http.get<any>(`${this.API_BASE_URL}/deleteParties`).pipe(
      catchError(error => this.handleError(error, 'Erreur lors de la suppression'))
    ).subscribe(response => {
      alert('Parties supprimées');
    });
  }

  supprimerTchatParties(): void {
    this.http.get<any>(`${this.API_BASE_URL}/deleteTchatParties`).pipe(
      catchError(error => this.handleError(error, 'Erreur lors de la suppression'))
    ).subscribe(response => {
      alert('Historique supprimé');
    });
  }

  updateProperties(): void {
    this.propertiesService.loadProperties();
  }

  updateDecks(): void {
    this.decks.forEach(deck => {
      deck.formats = [];
      this.formats.forEach(format => {
        if (this.deckService.validateDeck(deck, format) === null) {
          deck.formats.push(format);
        }
      });
    });

    this.http.post<Deck[]>(`${this.API_BASE_URL}/decks`, this.decks).pipe(
      catchError(error => this.handleError(error, 'Erreur lors de la mise à jour des decks'))
    ).subscribe(data => {
      alert('Formats mis à jour');
    });
  }

  private getAllFormats(): void {
    this.referentielService.getAllFormats().subscribe(data => {
      this.formats = data!;
    });
  }

  private getAllDecks(): void {
    this.http.get<Deck[]>(`${this.API_BASE_URL}/allDecks`).pipe(
      defaultIfEmpty([]), // Remplace null par un tableau vide en cas d'erreur
      catchError(error => this.handleError(error, 'Erreur lors de la récupération des decks'))
    ).subscribe(data => {
      this.decks = data!;
    });
  }

  private handleError(error: any, message: string) {
    console.error('There was an error!', error);
    alert(message);
    return of(null);
  }
}
