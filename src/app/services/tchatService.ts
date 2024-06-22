import { Injectable } from '@angular/core';
import {IDeck} from "../interfaces/IDeck";
import {HttpClient} from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import {AuthentificationService} from "./authentification.service";
import { catchError, map } from 'rxjs/operators';
import {IFormat} from "../interfaces/IFormat";
import {ICarte} from "../interfaces/ICarte";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {IPlayerState} from "../interfaces/IPlayerState";
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";
import {IChatPartieMessage} from "../interfaces/IChatPartieMessage";

@Injectable({
  providedIn: 'root'
})
export class TchatService {

  constructor(private http: HttpClient) { }

  sendMessage(message: string, partieId: number) {
    if (message && message != '') {
      let messageTchat: IChatPartieMessage = {id: 0, partieId: partieId, auteur: 'PampaBot', texte: message};

      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/chatMessages', messageTchat).subscribe({
        next: () => {

        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    }
  }
}
