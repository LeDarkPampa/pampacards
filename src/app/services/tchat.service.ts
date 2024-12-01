import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {ChatPartieMessage} from "../classes/ChatPartieMessage";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class TchatService extends ApiService {

  constructor(private http: HttpClient) {
    super();
  }

  sendMessage(message: string, partieId: number) {
    if (message && message != '') {
      let messageTchat: ChatPartieMessage = {id: 0, partieId: partieId, auteur: 'PampaBot', texte: message};

      this.http.post<any>(this.API_URL + '/chatMessages', messageTchat).subscribe({
        next: () => {

        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    }
  }
}
