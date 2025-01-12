import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Utilisateur} from "../classes/Utilisateur";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class DemandeCombatService extends ApiService {

  constructor(private http: HttpClient) {
    super();
  }

  addUserToFight(userId: number): Observable<number> {
    return this.http.post<number>(`${this.API_URL}/addUserToFight`, userId);
  }

  removeUserToFight(userId: number): Observable<number> {
    return this.http.post<number>(`${this.API_URL}/removeUserToFight`, userId);
  }

  getUsersSearchingFight(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.API_URL}/usersToFight`);
  }

  createChallenge(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/createChallenge`, data);
  }

  getBots(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.API_URL}/bots`);
  }

}
