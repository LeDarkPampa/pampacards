import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Deck } from '../../classes/decks/Deck';
import { Carte } from '../../classes/cartes/Carte';
import { ReferentielService } from '../../services/referentiel.service';
import { UiMessageService } from '../../services/ui-message.service';
import { INFOS_MSG } from '../../core/messages/domain.messages';

@Component({
  selector: 'app-decks-base-details',
  templateUrl: './decks-base-details.component.html',
  styleUrls: ['./decks-base-details.component.css', '../../app.component.css']
})
export class DecksBaseDetailsComponent implements OnInit, OnDestroy {
  decksDeBase: Deck[] = [];
  deckSelectionne?: Deck;
  loading = true;
  loadError = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private referentielService: ReferentielService,
    private uiMessage: UiMessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.referentielService
      .getDecksBase()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.decksDeBase = data;
          this.loading = false;
          this.loadError = false;
          this.applyDeckFromQuery();
        },
        error: () => {
          this.loading = false;
          this.loadError = true;
          this.uiMessage.error(INFOS_MSG.DECKS_ERR);
        }
      });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.decksDeBase.length) {
        this.applyDeckFromQuery();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByDeckId(_: number, deck: Deck): number {
    return deck.id;
  }

  trackByCarteId(_: number, carte: Carte): number {
    return carte.id;
  }

  selectionnerDeck(deck: Deck): void {
    this.deckSelectionne = deck;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { deck: deck.id },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  openCardDetail(carte: Carte, event: Event): void {
    if (event instanceof KeyboardEvent) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
      } else {
        return;
      }
    } else if (event instanceof MouseEvent) {
      const t = event.target as HTMLElement | null;
      if (t?.closest('a,button,input,select,textarea')) {
        return;
      }
    }
    void this.router.navigate(['/card-view', carte.id]);
  }

  private applyDeckFromQuery(): void {
    const raw = this.route.snapshot.queryParamMap.get('deck');
    if (raw == null || raw === '') {
      this.deckSelectionne = undefined;
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      this.deckSelectionne = undefined;
      return;
    }
    this.deckSelectionne = this.decksDeBase.find(d => d.id === n);
  }
}
