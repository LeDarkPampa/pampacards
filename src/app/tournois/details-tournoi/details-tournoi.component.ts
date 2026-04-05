import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Tournoi } from '../../classes/competitions/Tournoi';
import { CompetitionParticipant } from '../../classes/competitions/CompetitionParticipant';
import { interval, startWith, Subscription, switchMap } from 'rxjs';
import { AuthentificationService } from '../../services/authentification.service';
import { TournoiService } from '../../services/tournoi.service';
import { Affrontement } from '../../classes/combats/Affrontement';
import { LigueTournoiStatutEnum } from '../../enums/LigueTournoiStatutEnum';

@Component({
  selector: 'app-details-tournoi',
  templateUrl: './details-tournoi.component.html',
  styleUrls: ['./details-tournoi.component.css', '../../app.component.css'],
})
export class DetailsTournoiComponent implements OnInit, OnDestroy {
  userId = 0;
  tournoi = signal<Tournoi | null>(null);
  players = signal<CompetitionParticipant[]>([]);

  private subscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthentificationService,
    private tournoiService: TournoiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const tournoiId = params['id'];

      this.userId = this.authService.getUserId();

      this.subscription = interval(5000)
        .pipe(
          startWith(0),
          switchMap(() => this.tournoiService.getTournoi(Number(tournoiId)))
        )
        .subscribe({
          next: (t) => {
            this.tournoi.set(t);
            this.players.set(t.participants);
          },
        });
    });
  }

  findParticipantById(id: number): string {
    const participant = this.players().find((player) => player.utilisateur.id == id);
    return participant ? participant.utilisateur.pseudo : 'Aucun';
  }

  isTournoiTermine(t: Tournoi): boolean {
    return t.statut === LigueTournoiStatutEnum.TERMINE;
  }

  getTournoiVainqueurId(t: Tournoi): number {
    const rounds = t.rounds || [];
    if (rounds.length === 0) {
      return 0;
    }
    const lastRound = rounds[rounds.length - 1];
    const affrontements = lastRound.affrontements || [];
    if (affrontements.length === 0) {
      return 0;
    }
    const lastAff = affrontements[affrontements.length - 1];
    return lastAff.vainqueurId ?? 0;
  }

  isAffontementTermine(affrontement: Affrontement | undefined): boolean {
    if (affrontement) {
      return affrontement.vainqueurId != null;
    }
    return true;
  }

  playerInAffrontement(joueurId1: number, joueurId2: number): boolean {
    const u = this.authService.getUser();
    return u.id === joueurId1 || u.id === joueurId2;
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number) {
    const t = this.tournoi();
    if (t) {
      this.tournoiService.openAffrontementPartie(joueurId1, joueurId2, t, this.authService.getUser());
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
