import { Injectable } from '@angular/core';
import {IDeck} from "../interfaces/IDeck";
import {HttpClient} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {AuthentificationService} from "./authentification.service";
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DeckService {

  constructor(private http: HttpClient, private authService: AuthentificationService) { }

  getAllPlayerDecks(): Observable<IDeck[]> {
    return this.http.get<IDeck[]>('http://localhost:8080/backend/api/decks?userId=' + this.authService.userId).pipe(
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
