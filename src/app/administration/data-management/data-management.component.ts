import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PropertiesService } from '../../services/properties.service';
import { IDeck } from '../../interfaces/IDeck';
import { IFormat } from '../../interfaces/IFormat';
import { DeckService } from '../../services/deck.service';
import { catchError, defaultIfEmpty } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.css', '../../app.component.css']
})
export class DataManagementComponent implements OnInit {

  private readonly API_BASE_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';

  decks: IDeck[] = [];
  formats: IFormat[] = [];

  constructor(
    private http: HttpClient,
    private propertiesService: PropertiesService,
    private deckService: DeckService
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

    this.http.post<IDeck[]>(`${this.API_BASE_URL}/decks`, this.decks).pipe(
      catchError(error => this.handleError(error, 'Erreur lors de la mise à jour des decks'))
    ).subscribe(data => {
      alert('Formats mis à jour');
    });
  }

  private getAllFormats(): void {
    this.http.get<IFormat[]>(`${this.API_BASE_URL}/formats`).pipe(
      defaultIfEmpty([]), // Remplace null par un tableau vide en cas d'erreur
      catchError(error => this.handleError(error, 'Erreur lors de la récupération des formats'))
    ).subscribe(data => {
      this.formats = data!;
    });
  }

  private getAllDecks(): void {
    this.http.get<IDeck[]>(`${this.API_BASE_URL}/allDecks`).pipe(
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
