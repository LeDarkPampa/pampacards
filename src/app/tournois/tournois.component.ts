import { Component, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subject, take, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DialogService } from 'primeng/dynamicdialog';
import { TournoiService } from '../services/tournoi.service';
import { Tournoi } from '../classes/competitions/Tournoi';
import { Ligue } from '../classes/competitions/Ligue';
import { AuthentificationService } from '../services/authentification.service';
import { UserAndLigue } from '../classes/competitions/UserAndLigue';
import { Utilisateur } from '../classes/Utilisateur';
import { LigueTournoiStatutEnum } from '../enums/LigueTournoiStatutEnum';
import { Deck } from '../classes/decks/Deck';
import { InscriptionDialogComponent } from './inscription-dialog/inscription-dialog.component';
import { UtilisateurService } from '../services/utilisateur.service';
import { InscriptionCompetition } from '../classes/competitions/InscriptionCompetition';
import { UserAndTournoi } from '../classes/competitions/UserAndTournoi';
import { CompetitionParticipant } from '../classes/competitions/CompetitionParticipant';
import { UiMessageService } from '../services/ui-message.service';
import { TOURNOIS_MSG } from '../core/messages/domain.messages';

@Component({
  selector: 'app-tournois',
  templateUrl: './tournois.component.html',
  styleUrls: ['./tournois.component.css', '../app.component.css']
})
export class TournoisComponent implements OnInit, OnDestroy {
  tournoisOuverts = signal<Tournoi[]>([]);
  liguesOuvertes = signal<Ligue[]>([]);

  registeredTournaments = signal<Tournoi[]>([]);
  registeredLigues = signal<Ligue[]>([]);

  utilisateur = signal<Utilisateur | null>(null);

  allDecks = signal<Deck[]>([]);

  listsLoading = signal(true);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private zone: NgZone,
    private dialogService: DialogService,
    private tournoiService: TournoiService,
    private authService: AuthentificationService,
    private utilisateurService: UtilisateurService,
    private uiMessage: UiMessageService
  ) {}

  ngOnInit(): void {
    this.utilisateur.set(this.authService.getUser());
    this.utilisateurService
      .getAllDecks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: playerDecks => this.allDecks.set(playerDecks),
        error: () => this.uiMessage.error(TOURNOIS_MSG.DECKS_LOAD_ERR)
      });
    this.refreshTournoisLigueListes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByTournoiId(_: number, t: Tournoi): number {
    return t.id;
  }

  trackByLigueId(_: number, l: Ligue): number {
    return l.id;
  }

  trackByParticipantId(_: number, p: CompetitionParticipant): number {
    return p.id;
  }

  /** Classes CSS pour l’affichage du statut (tableaux disponibles + inscriptions). */
  getStatutNgClass(statut: string): Record<string, boolean> {
    return {
      'tournois-statut--cours': statut === LigueTournoiStatutEnum.EN_COURS,
      'tournois-statut--attente': statut === LigueTournoiStatutEnum.EN_ATTENTE,
      'tournois-statut--termine': statut === LigueTournoiStatutEnum.TERMINE,
      'tournois-statut--inscr': statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES,
      'tournois-statut--ferme': statut === LigueTournoiStatutEnum.INSCRIPTIONS_FERMEES,
      'tournois-statut--avenir': statut === LigueTournoiStatutEnum.A_VENIR
    };
  }

  registerForTournament(tournoi: Tournoi): void {
    this.zone.run(() => {
      const ref = this.dialogService.open(InscriptionDialogComponent, {
        header: 'Inscription pour ' + tournoi.nom,
        width: '60%',
        height: '60%',
        data: {
          competition: tournoi,
          decks: this.allDecks().filter(deck =>
            deck.formats.some(format => format.formatId === tournoi.format.formatId)
          )
        },
        closable: false
      });

      ref.onClose.pipe(take(1)).subscribe((inscriptionCompetition: InscriptionCompetition | undefined) => {
        if (inscriptionCompetition?.status !== 'OK') {
          return;
        }
        const user = this.authService.getUser();
        if (!user) {
          return;
        }
        const inscriptionValues: UserAndTournoi = {
          tournoi,
          utilisateur: user,
          decks: inscriptionCompetition.decks
        };

        this.tournoiService
          .inscrireTournoi(inscriptionValues)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.uiMessage.success(TOURNOIS_MSG.INSCRIPTION_OK);
              this.refreshTournoisLigueListes();
            },
            error: () => {
              this.uiMessage.error(TOURNOIS_MSG.INSCRIPTION_ERR);
              this.refreshTournoisLigueListes();
            }
          });
      });
    });
  }

  registerForLigue(ligue: Ligue): void {
    this.zone.run(() => {
      const ref = this.dialogService.open(InscriptionDialogComponent, {
        header: 'Inscription pour ' + ligue.nom,
        width: '60%',
        height: '60%',
        data: {
          competition: ligue,
          decks: this.allDecks().filter(deck =>
            deck.formats.some(format => format.formatId === ligue.format.formatId)
          )
        },
        closable: false
      });

      ref.onClose.pipe(take(1)).subscribe((inscriptionCompetition: InscriptionCompetition | undefined) => {
        if (inscriptionCompetition?.status !== 'OK') {
          return;
        }
        const user = this.authService.getUser();
        if (!user) {
          return;
        }
        const inscriptionValues: UserAndLigue = {
          ligue,
          utilisateur: user,
          decks: inscriptionCompetition.decks
        };

        this.tournoiService
          .inscrireLigue(inscriptionValues)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.uiMessage.success(TOURNOIS_MSG.INSCRIPTION_OK);
              this.refreshTournoisLigueListes();
            },
            error: () => {
              this.uiMessage.error(TOURNOIS_MSG.INSCRIPTION_ERR);
              this.refreshTournoisLigueListes();
            }
          });
      });
    });
  }

  unregisterForTournament(tournoi: Tournoi): void {
    const user = this.authService.getUser();
    if (!user) {
      return;
    }
    const inscriptionValues: UserAndTournoi = {
      tournoi,
      utilisateur: user,
      decks: []
    };

    this.tournoiService
      .desinscrireTournoi(inscriptionValues)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.uiMessage.success(TOURNOIS_MSG.DESINSCRIPTION_OK);
          this.refreshTournoisLigueListes();
        },
        error: () => {
          this.uiMessage.error(TOURNOIS_MSG.DESINSCRIPTION_ERR);
          this.refreshTournoisLigueListes();
        }
      });
  }

  unregisterForLigue(ligue: Ligue): void {
    const user = this.authService.getUser();
    if (!user) {
      return;
    }
    const inscriptionValues: UserAndLigue = {
      ligue,
      utilisateur: user,
      decks: []
    };

    this.tournoiService
      .desinscrireLigue(inscriptionValues)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.uiMessage.success(TOURNOIS_MSG.DESINSCRIPTION_OK);
          this.refreshTournoisLigueListes();
        },
        error: () => {
          this.uiMessage.error(TOURNOIS_MSG.DESINSCRIPTION_ERR);
          this.refreshTournoisLigueListes();
        }
      });
  }

  isUserInTournoiParticipants(tournoi: Tournoi): boolean {
    const u = this.utilisateur();
    if (!u) {
      return false;
    }
    return tournoi.participants.some(p => p.utilisateur?.id === u.id);
  }

  isUserInLigueParticipants(ligue: Ligue): boolean {
    const u = this.utilisateur();
    if (!u) {
      return false;
    }
    return ligue.participants.some(p => p.utilisateur?.id === u.id);
  }

  inscriptionTournoiOuverte(tournoi: Tournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  inscriptionLigueOuverte(ligue: Ligue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  isTournoiEnCours(tournoi: Tournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.EN_COURS;
  }

  isTournoiTermine(tournoi: Tournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.TERMINE;
  }

  isLigueEnCours(ligue: Ligue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.EN_COURS;
  }

  isLigueTermine(ligue: Ligue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.TERMINE;
  }

  canVoirTournoiInscrit(tournoi: Tournoi): boolean {
    return (
      this.isUserInTournoiParticipants(tournoi) &&
      (this.isTournoiEnCours(tournoi) || this.isTournoiTermine(tournoi))
    );
  }

  canVoirLigueInscrit(ligue: Ligue): boolean {
    return (
      this.isUserInLigueParticipants(ligue) &&
      (this.isLigueEnCours(ligue) || this.isLigueTermine(ligue))
    );
  }

  refreshTournoisLigueListes(): void {
    this.listsLoading.set(true);
    const user = this.utilisateur();

    const reqs = [
      this.tournoiService.getTournoisAVenir(),
      this.tournoiService.getLiguesAVenir(),
      ...(user
        ? [
            this.tournoiService.getTournoisValidesForUser(user.id),
            this.tournoiService.getLiguesValidesForUser(user.id)
          ]
        : [])
    ];

    forkJoin(reqs)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.listsLoading.set(false))
      )
      .subscribe({
        next: results => {
          this.tournoisOuverts.set(results[0] as Tournoi[]);
          this.liguesOuvertes.set(results[1] as Ligue[]);
          if (user && results.length >= 4) {
            this.registeredTournaments.set(results[2] as Tournoi[]);
            this.registeredLigues.set(results[3] as Ligue[]);
          } else {
            this.registeredTournaments.set([]);
            this.registeredLigues.set([]);
          }
        },
        error: () => {
          this.uiMessage.error(TOURNOIS_MSG.LISTE_ERR);
          this.tournoisOuverts.set([]);
          this.liguesOuvertes.set([]);
          this.registeredTournaments.set([]);
          this.registeredLigues.set([]);
        }
      });
  }

  voirTournoi(tournoi: Tournoi): void {
    void this.router.navigate(['/tournoi', tournoi.id]);
  }

  voirLigue(ligue: Ligue): void {
    void this.router.navigate(['/ligue', ligue.id]);
  }
}
