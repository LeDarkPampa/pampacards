import {Component} from '@angular/core';
import {Utilisateur} from "../../classes/Utilisateur";
import {Deck} from "../../classes/decks/Deck";
import {ReferentielService} from "../../services/referentiel.service";
import { UiMessageService } from '../../services/ui-message.service';
import { INFOS_MSG } from '../../core/messages/domain.messages';

@Component({
  selector: 'app-decks-base-details',
  templateUrl: './decks-base-details.component.html',
  styleUrls: ['./decks-base-details.component.css', '../../app.component.css']
})
export class DecksBaseDetailsComponent {
  utilisateurs: Utilisateur[] = [];
  decksDeBase: Deck[] = [];
  selectedUserName: string = '';
  pseudosUtilisateurs: string[] = [];

  // @ts-ignore
  deckSelectionne: Deck;

  constructor(private referentielService: ReferentielService, private uiMessage: UiMessageService) {
    this.referentielService.getAllUsers().subscribe({
      next: data => {
        this.utilisateurs = data;
        this.pseudosUtilisateurs = data.map(user => user.pseudo);
      },
      error: () => {
        this.uiMessage.error(INFOS_MSG.USERS_ERR);
      }
    });

    this.referentielService.getDecksBase().subscribe({
      next: data => {
        this.decksDeBase = data;
      },
      error: () => {
        this.uiMessage.error(INFOS_MSG.DECKS_ERR);
      }
    });
  }

  selectionnerDeck(deck: Deck) {
    this.deckSelectionne = deck;
  }
}
