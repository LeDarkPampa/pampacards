import { Component, OnInit } from '@angular/core';
import { Utilisateur } from '../../classes/Utilisateur';
import { Deck } from '../../classes/decks/Deck';
import { ReferentielService } from '../../services/referentiel.service';
import { UtilisateurService } from '../../services/utilisateur.service';
import { UiMessageService } from '../../services/ui-message.service';
import { ADMIN_MSG } from '../../core/messages/domain.messages';

@Component({
  selector: 'app-attribution-deck',
  templateUrl: './attribution-deck.component.html',
  styleUrls: ['./attribution-deck.component.css', '../../app.component.css'],
})
export class AttributionDeckComponent implements OnInit {
  utilisateurs: Utilisateur[] = [];
  decksDeBase: Deck[] = [];
  selectedUserName: string = '';
  pseudosUtilisateurs: string[] = [];

  deckSelectionne!: Deck;

  saveBusy = false;

  constructor(
    private referentielService: ReferentielService,
    private utilisateurService: UtilisateurService,
    private uiMessage: UiMessageService
  ) {
    this.referentielService.getAllUsers().subscribe({
      next: (data) => {
        this.utilisateurs = data;
        this.pseudosUtilisateurs = data.map((user) => user.pseudo);
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.USERS_ERR);
      },
    });

    this.referentielService.getDecksBase().subscribe({
      next: (data) => {
        this.decksDeBase = data;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.DECKS_ERR);
      },
    });
  }

  ngOnInit() {}

  selectionnerDeck(deck: Deck) {
    this.deckSelectionne = deck;
  }

  ajouterCartesAuDeck() {
    if (!this.selectedUserName || !this.deckSelectionne) {
      return;
    }
    const userPseudoAndCards = {
      pseudo: this.selectedUserName,
      cartes: [...this.deckSelectionne.cartes],
    };

    this.saveBusy = true;
    this.utilisateurService.addCartesToCollection(userPseudoAndCards).subscribe({
      next: () => {
        this.uiMessage.success(ADMIN_MSG.COLLECTION_OK);
        this.saveBusy = false;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.COLLECTION_ERR);
        this.saveBusy = false;
      },
    });
  }
}
