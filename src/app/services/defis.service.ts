import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Defi} from "../classes/Defi";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class DefisService extends ApiService {

  constructor(private http: HttpClient) {
    super();
  }

  // Récupère la liste des défis pour un utilisateur
  getDefis(userId: number): Observable<Defi[]> {
    return this.http.get<Defi[]>(`${this.API_URL}/defis?userId=${userId}`);
  }
}
