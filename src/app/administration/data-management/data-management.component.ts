import { Component, OnInit } from '@angular/core';
import { PropertiesService } from '../../services/properties.service';
import { Deck } from '../../classes/decks/Deck';
import { Format } from '../../classes/decks/Format';
import { DeckService } from '../../services/deck.service';
import { catchError, defaultIfEmpty } from 'rxjs/operators';
import { of } from 'rxjs';
import { ReferentielService } from '../../services/referentiel.service';
import { AdministrationService } from '../../services/administration.service';
import { UiMessageService } from '../../services/ui-message.service';
import { ADMIN_MSG } from '../../core/messages/domain.messages';

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.css', '../../app.component.css'],
})
export class DataManagementComponent implements OnInit {
  decks: Deck[] = [];
  formats: Format[] = [];

  busy = false;

  constructor(
    private administrationService: AdministrationService,
    private propertiesService: PropertiesService,
    private deckService: DeckService,
    private referentielService: ReferentielService,
    private uiMessage: UiMessageService
  ) {}

  ngOnInit(): void {
    this.getAllFormats();
    this.getAllDecks();
  }

  supprimerParties(): void {
    this.busy = true;
    this.administrationService.deleteParties().subscribe({
      next: () => {
        this.uiMessage.success(ADMIN_MSG.PARTIES_OK);
        this.busy = false;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.DATA_ERR);
        this.busy = false;
      },
    });
  }

  supprimerTchatParties(): void {
    this.busy = true;
    this.administrationService.deleteTchatParties().subscribe({
      next: () => {
        this.uiMessage.success(ADMIN_MSG.TCHAT_OK);
        this.busy = false;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.DATA_ERR);
        this.busy = false;
      },
    });
  }

  updateProperties(): void {
    this.propertiesService.loadProperties();
  }

  updateDecks(): void {
    this.decks.forEach((deck) => {
      deck.formats = [];
      this.formats.forEach((format) => {
        if (this.deckService.validateDeck(deck, format) === null) {
          deck.formats.push(format);
        }
      });
    });

    this.busy = true;
    this.administrationService.saveAllDecks(this.decks).subscribe({
      next: () => {
        this.uiMessage.success(ADMIN_MSG.DECKS_FORMAT_OK);
        this.busy = false;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.DATA_ERR);
        this.busy = false;
      },
    });
  }

  private getAllFormats(): void {
    this.referentielService.getAllFormats().subscribe((data) => {
      this.formats = data!;
    });
  }

  private getAllDecks(): void {
    this.administrationService
      .getAllDecksAdmin()
      .pipe(
        defaultIfEmpty([]),
        catchError(() => {
          this.uiMessage.error(ADMIN_MSG.DECKS_ERR);
          return of([]);
        })
      )
      .subscribe((data) => {
        this.decks = data!;
      });
  }
}
