import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Utilisateur } from '../classes/Utilisateur';
import { ApiService } from './api.service';
import { DemandeCombat } from '../classes/combats/DemandeCombat';
import { Partie } from '../classes/parties/Partie';

@Injectable({
  providedIn: 'root',
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

  createChallenge(data: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.API_URL}/createChallenge`, data);
  }

  createBotPartie(data: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.API_URL}/createBotPartie`, data);
  }

  getBots(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.API_URL}/bots`);
  }

  updateDemandeCombat(demande: DemandeCombat): Observable<unknown> {
    return this.http.post(`${this.API_URL}/updateDemandeCombat`, demande);
  }

  deleteDemandeCombat(demande: DemandeCombat): Observable<unknown> {
    return this.http.request('delete', `${this.API_URL}/demandeCombat`, { body: demande });
  }

  createPartieFromDemande(demande: DemandeCombat): Observable<number> {
    return this.http.post<number>(`${this.API_URL}/createPartie`, demande);
  }

  getPartieEnCours(utilisateurId: number): Observable<Partie> {
    return this.http.get<Partie>(`${this.API_URL}/partieEnCours?utilisateurId=${utilisateurId}`);
  }
}
