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

  getAllTournois(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/all`);
  }

  getTournoisAVenir(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/tournois-a-venir`);
  }

  getTournoisValidesForUser(userId: number): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/tournois-valides?userId=` + userId);
  }

  saveTournoi(newTournoi: ITournoi): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/tournois`, newTournoi);
  }

  deleteTournoi(id: number): Observable<any> {
    return this.http.delete(`${this.BACKEND_URL}/tournois/${id}`);
  }

  getAllLigues(): Observable<ILigue[]> {
    return this.http.get<ILigue[]>(`${this.BACKEND_URL}/ligues/all`);
  }

  getLiguesAVenir(): Observable<ILigue[]> {
    return this.http.get<ILigue[]>(`${this.BACKEND_URL}/ligues/ligues-a-venir`);
  }

  getLiguesValidesForUser(userId: number): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/ligues/ligues-valides?userId=` + userId);
  }

  saveLigue(newLigue: ILigue): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/ligues`, newLigue);
  }

  deleteLigue(id: number): Observable<any> {
    return this.http.delete(`${this.BACKEND_URL}/ligues/${id}`);
  }

}
