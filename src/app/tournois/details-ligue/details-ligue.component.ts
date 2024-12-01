import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {Ligue} from "../../classes/competitions/Ligue";
import {CompetitionParticipant} from "../../classes/competitions/CompetitionParticipant";
import {interval, startWith, Subscription, switchMap} from "rxjs";
import {Utilisateur} from "../../classes/Utilisateur";
import {AuthentificationService} from "../../services/authentification.service";
import {TournoiService} from "../../services/tournoi.service";
import {Affrontement} from "../../classes/combats/Affrontement";

@Component({
  selector: 'app-details-ligue',
  templateUrl: './details-ligue.component.html',
  styleUrls: ['./details-ligue.component.css', '../../app.component.css']
})
export class DetailsLigueComponent implements OnInit, OnDestroy {

  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private subscription: Subscription | undefined;
  utilisateur!: Utilisateur;
  ligue= signal<Ligue | null>(null);
  players = signal<CompetitionParticipant[]>([]);
  sortedPlayers = signal<CompetitionParticipant[]>([]);
  hasAffrontement = signal(false);

  constructor(private http: HttpClient, private route: ActivatedRoute,
              private authService: AuthentificationService, private tournoiService: TournoiService) {

  }

  ngOnInit() {
    this.utilisateur = this.authService.getUser();

    this.route.params.subscribe(({ id: ligueId }) => {
      this.subscription = interval(5000)
        .pipe(
          startWith(0),
          switchMap(() => this.http.get<Ligue>(`${this.BACKEND_URL}/ligues/ligue?id=${ligueId}`))
        )
        .subscribe({
          next: ligue => this.updateLigueData(ligue),
          error: error => console.error('There was an error!', error),
        });
    });
  }

  private updateLigueData(ligue: Ligue) {
    this.ligue.set(ligue);
    const participants = this.getSortedParticipants(ligue);
    this.players.set(participants);
    this.hasAffrontement.set(this.checkIfAffrontement(this.utilisateur.id, ligue.affrontements));
    this.sortedPlayers.set(this.sortPlayers(participants));
  }

  private getSortedParticipants(ligue: Ligue): CompetitionParticipant[] {
    return ligue.participants
      .filter(p => p.utilisateur)
      .sort(this.compareByPseudo);
  }

  private sortPlayers(players: CompetitionParticipant[]): CompetitionParticipant[] {
    return players.sort(this.comparePlayers.bind(this));
  }

  private compareByPseudo(a: CompetitionParticipant, b: CompetitionParticipant): number {
    return a.utilisateur?.pseudo.localeCompare(b.utilisateur?.pseudo ?? '') || 0;
  }

  private comparePlayers(playerA: CompetitionParticipant, playerB: CompetitionParticipant): number {
    const victoriesA = this.getNombreVictoires(playerA.utilisateur.id);
    const victoriesB = this.getNombreVictoires(playerB.utilisateur.id);

    if (victoriesA !== victoriesB) return victoriesB - victoriesA;

    const defeatsA = this.getNombreDefaites(playerA.utilisateur.id);
    const defeatsB = this.getNombreDefaites(playerB.utilisateur.id);

    if (defeatsA !== defeatsB) return defeatsA - defeatsB;

    const scoreA = this.getNombreManchesPerdues(playerA.utilisateur.id);
    const scoreB = this.getNombreManchesPerdues(playerB.utilisateur.id);

    return scoreA - scoreB;
  }

  private checkIfAffrontement(id: number, affrontements: Affrontement[]): boolean {
    return affrontements.some(affrontement =>
      (affrontement.joueur1Id === id || affrontement.joueur2Id === id) &&
      !affrontement.vainqueurId
    );
  }

  getScoreAffrontement(joueurId1: number, joueurId2: number): string {
    const affrontement = this.tournoiService.getAffrontement(joueurId1, joueurId2, this.ligue()!);
    return affrontement ? `${affrontement.scoreJ1} - ${affrontement.scoreJ2}` : 'A venir';
  }

  getNombreVictoires(joueurId: number): number {
    return this.ligue()!.affrontements.filter(a => a.vainqueurId === joueurId).length;
  }

  getNombreDefaites(joueurId: number): number {
    return this.ligue()!.affrontements.filter(a =>
      (a.joueur1Id === joueurId || a.joueur2Id === joueurId) &&
      a.vainqueurId && a.vainqueurId !== joueurId
    ).length;
  }


  playerInAffrontement(joueurId1: number, joueurId2: number): boolean {
    return (this.utilisateur.id === joueurId1 || this.utilisateur.id === joueurId2);
  }

  isAffrontement(joueurId1: number, joueurId2: number): boolean {
    return this.ligue()!.affrontements.some(affrontement =>
      ((affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
      (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1))
    );
  }

  isAffrontementTermine(affrontement: Affrontement | undefined): boolean {
    if (affrontement) {
      return affrontement.vainqueurId != null;
    } else {
      return true;
    }
  }

  getNombreNuls(joueurId: number): number {
    return this.ligue()!.affrontements.filter(affrontement =>
      (affrontement.joueur1Id === joueurId || affrontement.joueur2Id === joueurId)
      && (affrontement.vainqueurId !== null && affrontement.vainqueurId === 0)).length;
  }

  getNombreManchesPerdues(joueurId: number): number {
    return this.ligue()!.affrontements
      .filter(a => a.joueur1Id === joueurId || a.joueur2Id === joueurId)
      .reduce((total, a) => total + (a.joueur1Id === joueurId ? a.scoreJ2 : a.scoreJ1), 0);
  }

  getNombreManchesGagnees(joueurId: number): number {
    return this.ligue()!.affrontements
      .filter(affrontement =>
        ((affrontement.joueur1Id === joueurId || affrontement.joueur2Id === joueurId))
      )
      .reduce((totalManchesGagnees, affrontement) => {
        return totalManchesGagnees + ((affrontement.joueur1Id == joueurId) ? affrontement.scoreJ1 : affrontement.scoreJ2);
      }, 0);
  }

  getAffrontement(joueurId1: number, joueurId2: number): Affrontement | undefined {
    if (this.ligue && this.ligue()!.affrontements) {
      return this.ligue()!.affrontements.find(affrontement =>
        (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
        (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1)
      );
    } else {
      return undefined;
    }
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number) {
    if (this.ligue()) {
      this.tournoiService.openAffrontementPartie(joueurId1, joueurId2, this.ligue()!, this.authService.getUser());
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
