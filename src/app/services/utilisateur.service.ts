import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {ApiService} from "./api.service";
import {Utilisateur} from "../classes/Utilisateur";
import {catchError, map} from "rxjs/operators";
import {Collection} from "../classes/Collection";
import {Deck} from "../classes/decks/Deck";
import {AuthentificationService} from "./authentification.service";
import {Avatar} from "../classes/Avatar";

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService extends ApiService {

  constructor(private http: HttpClient, private authService: AuthentificationService) {
    super();
  }

  getUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.API_URL + `/users`);
  }

  createUser(user: { pseudo: string, password: string }): Observable<any> {
    return this.http.post<any>(this.API_URL + '/user', user);
  }

  updatePassword(utilisateur: Utilisateur): Observable<any> {
    return this.http.post<any>(this.API_URL + '/updatePassword', utilisateur);
  }

  reinitUser(pseudo: string): Observable<any> {
    return this.http.post<any>(this.API_URL + '/reinituser', pseudo);
  }

  getCollection(userId: number): Observable<Collection> {
    return this.http.get<Collection>(this.API_URL + `/collection?userId=${userId}`).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  saveAvatar(avatar: Avatar): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/avatar`, avatar);
  }

  getAllDecks(): Observable<Deck[]> {
    return this.http.get<Deck[]>(this.API_URL + '/decks?userId=' + this.authService.getUserId()).pipe(
      map((decks: Deck[]) => {
        return decks.sort((a, b) => {
          const date1 = new Date(a.dateCreation);
          const date2 = new Date(b.dateCreation);
          return date1.valueOf() - date2.valueOf();
        });
      }),
      catchError(error => {
        console.error('There was an error!', error);
        return throwError(error);
      })
    );
  }

  getElementsDebloques(utilisateurId: number) {
    return this.http.get<any[]>(`/api/utilisateur/debloques/${utilisateurId}`);
  }
}
