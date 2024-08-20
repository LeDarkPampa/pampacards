import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IDeck } from '../interfaces/IDeck';
import { IFormat } from '../interfaces/IFormat';
import { ICollection } from '../interfaces/ICollection';
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class DeckbuilderService extends ApiService {

  constructor(private http: HttpClient) {
    super();}

  getAllPlayerDecks(): Observable<IDeck[]> {
    return this.http.get<IDeck[]>(this.API_URL + '/decks');
  }

  saveDeck(deck: IDeck): Observable<IDeck[]> {
    return this.http.post<IDeck[]>(this.API_URL + '/deck', deck);
  }

  deleteDeck(deck: IDeck): Observable<void> {
    return this.http.request<void>('delete', this.API_URL + '/decks', { body: deck });
  }

  getAllFormats(): Observable<IFormat[]> {
    return this.http.get<IFormat[]>(this.API_URL + '/formats');
  }

  getUserCollectionFiltered(userId: number): Observable<ICollection> {
    return this.http.get<ICollection>(this.API_URL + '/collection', {
      params: { userId: userId.toString() }
    });
  }
}
