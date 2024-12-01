import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from "rxjs/operators";
import {ApiService} from "./api.service";
import {Partie} from "../classes/parties/Partie";
import {ResultatPartie} from "../classes/parties/ResultatPartie";
@Injectable({
  providedIn: 'root'
})
export class AdministrationService extends ApiService {

  constructor(private http: HttpClient) {
    super();
  }


  getPartiesEnCours(): Observable<Partie[]> {
    return this.http.get<Partie[]>(this.API_URL + '/partiesEnCours').pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getResultatsParties(): Observable<ResultatPartie[]> {
    return this.http.get<ResultatPartie[]>(this.API_URL + '/resultatsPartiesTerminees').pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }
}
