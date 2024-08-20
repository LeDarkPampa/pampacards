import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ApiService} from "./api.service";
import {IUtilisateur} from "../interfaces/IUtilisateur";

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService extends ApiService {

  constructor(private http: HttpClient) {
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
}
