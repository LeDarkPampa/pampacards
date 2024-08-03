import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
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
