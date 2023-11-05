import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ITournoi} from "../interfaces/ITournoi";
import {ILigue} from "../interfaces/ILigue";

@Injectable({
  providedIn: 'root'
})
export class TournoiService {
  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";

  constructor(private http: HttpClient) { }

  getTournoisAVenir(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/a-venir`);
  }

  getTournoisInscriptionsOuvertes(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/inscriptions-ouvertes`);
  }

  getTournoisInscriptionsFermees(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/inscriptions-fermees`);
  }

  getTournoisEnCours(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/en-cours`);
  }

  getTournoisTermines(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/termines`);
  }

  getAllTournois(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/all`);
  }

  createTournoi(newTournoi: ITournoi): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/tournois`, newTournoi);
  }

  getAllLigues(): Observable<ILigue[]> {
    return this.http.get<ILigue[]>(`${this.BACKEND_URL}/ligues/all`);
  }

  getLiguesInscriptionsOuvertes(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/ligues/inscriptions-ouvertes`);
  }

  getLiguesInscriptionsFermees(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/ligues/inscriptions-fermees`);
  }

  getLiguesEnCours(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/ligues/en-cours`);
  }

  getLiguesTermines(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/ligues/termines`);
  }

  createLigue(newLigue: ILigue): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/ligues`, newLigue);
  }


}
