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

  getTournoisEnAttente(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/attente`);
  }

  getTournoisEnCours(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/encours`);
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

  createLigue(newLigue: ILigue): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/ligues`, newLigue);
  }
}
