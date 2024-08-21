import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {ApiService} from "./api.service";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {catchError, map} from "rxjs/operators";
import {ICollection} from "../interfaces/ICollection";
import {IDeck} from "../interfaces/IDeck";
import {AuthentificationService} from "./authentification.service";

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService extends ApiService {

  constructor(private http: HttpClient, private authService: AuthentificationService) {
    super();
  }

  getUtilisateurs(): Observable<IUtilisateur[]> {
    return this.http.get<IUtilisateur[]>(this.API_URL + `/users`);
  }

  createUser(user: { pseudo: string, password: string }): Observable<any> {
    return this.http.post<any>(this.API_URL + '/user', user);
  }

  updatePassword(utilisateur: IUtilisateur): Observable<any> {
    return this.http.post<any>(this.API_URL + '/updatePassword', utilisateur);
  }

  reinitUser(pseudo: string): Observable<any> {
    return this.http.post<any>(this.API_URL + '/reinituser', pseudo);
  }

  getCollection(userId: number): Observable<ICollection> {
    return this.http.get<ICollection>(this.API_URL + `/collection?userId=${userId}`).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getAllDecks(): Observable<IDeck[]> {
    return this.http.get<IDeck[]>(this.API_URL + '/decks?userId=' + this.authService.getUserId()).pipe(
      map((decks: IDeck[]) => {
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
}
