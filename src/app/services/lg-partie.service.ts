import {Injectable, NgZone} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable} from "rxjs";
import {Tournoi} from "../classes/competitions/Tournoi";
import {Ligue} from "../classes/competitions/Ligue";
import {Partie} from "../classes/parties/Partie";
import {OpenAffrontementDialogComponent} from "../tournois/open-affrontement-dialog/open-affrontement-dialog.component";
import {Deck} from "../classes/decks/Deck";
import {EvenementPartie} from "../classes/parties/EvenementPartie";
import {Utilisateur} from "../classes/Utilisateur";
import {Router} from "@angular/router";
import {DialogService} from "primeng/dynamicdialog";
import {ApiService} from "./api.service";
import {Carte} from "../classes/cartes/Carte";
import {Affrontement} from "../classes/combats/Affrontement";

@Injectable({
  providedIn: 'root'
})
export class LgPartieService extends ApiService {

  constructor(private http: HttpClient, private zone: NgZone, private router: Router, private dialogService: DialogService) {
    super();
  }

  getPartie(gameCode: number): Observable<Tournoi> {
    return this.http.get<Tournoi>(`${this.API_URL}/lg/game/${gameCode}/start`);
  }

  createPartie(maxPlayers: number): Observable<any> {
    return this.http.post(`${this.API_URL}/lg/game/create/${maxPlayers}`, null);
  }

}