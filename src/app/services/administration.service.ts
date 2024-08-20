import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from "rxjs/operators";
import {ApiService} from "./api.service";
import {IPartie} from "../interfaces/IPartie";
import {IResultatPartie} from "../interfaces/IResultatPartie";
@Injectable({
  providedIn: 'root'
})
export class AdministrationService extends ApiService {

  constructor(private http: HttpClient) {
    super();
  }


  getPartiesEnCours(): Observable<IPartie[]> {
    return this.http.get<IPartie[]>(this.API_URL + '/partiesEnCours').pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  getResultatsParties(): Observable<IResultatPartie[]> {
    return this.http.get<IResultatPartie[]>(this.API_URL + '/resultatsPartiesTerminees').pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }
}
