import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IDemandeCombat } from '../interfaces/IDemandeCombat';
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {IPartie} from "../interfaces/IPartie";
import {IFormat} from "../interfaces/IFormat";
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

  getUsersSearchingFight(): Observable<IUtilisateur[]> {
    return this.http.get<IUtilisateur[]>(`${this.API_URL}/usersToFight`);
  }

  updateDemandeCombat(demandeCombat: IDemandeCombat): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/updateDemandeCombat`, demandeCombat);
  }

  createChallenge(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/createChallenge`, data);
  }
}
