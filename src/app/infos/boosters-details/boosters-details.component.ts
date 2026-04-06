import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Booster } from '../../classes/Booster';
import { Carte } from '../../classes/cartes/Carte';
import { ReferentielService } from '../../services/referentiel.service';
import { UiMessageService } from '../../services/ui-message.service';
import { INFOS_MSG } from '../../core/messages/domain.messages';

@Component({
  selector: 'app-boosters-details',
  templateUrl: './boosters-details.component.html',
  styleUrls: ['./boosters-details.component.css', '../../app.component.css']
})
export class BoostersDetailsComponent implements OnInit, OnDestroy {
  boosters: Booster[] = [];
  boosterSelectionne?: Booster;
  loading = true;
  loadError = false;

  /** Taux affichés (source unique pour le tableau et toute réutilisation future). */
  readonly rarityRates = [
    { label: '1★', legend: '1 étoile', percent: '50 %' },
    { label: '2★', legend: '2 étoiles', percent: '30 %' },
    { label: '3★', legend: '3 étoiles', percent: '15 %' },
    { label: '4★', legend: '4 étoiles', percent: '5 %' }
  ] as const;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private referentielService: ReferentielService,
    private uiMessage: UiMessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.referentielService
      .getAllBoosters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: boosters => {
          this.boosters = boosters;
          this.loading = false;
          this.loadError = false;
          this.applyBoosterFromQuery();
        },
        error: () => {
          this.loading = false;
          this.loadError = true;
          this.uiMessage.error(INFOS_MSG.BOOSTERS_ERR);
        }
      });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.boosters.length) {
        this.applyBoosterFromQuery();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByBoosterId(_: number, booster: Booster): number {
    return booster.id;
  }

  trackByCarteId(_: number, carte: Carte): number {
    return carte.id;
  }

  selectionnerBooster(booster: Booster): void {
    this.boosterSelectionne = booster;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { booster: booster.id },
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

  private applyBoosterFromQuery(): void {
    const raw = this.route.snapshot.queryParamMap.get('booster');
    if (raw == null || raw === '') {
      this.boosterSelectionne = undefined;
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      this.boosterSelectionne = undefined;
      return;
    }
    this.boosterSelectionne = this.boosters.find(b => b.id === n);
  }
}
