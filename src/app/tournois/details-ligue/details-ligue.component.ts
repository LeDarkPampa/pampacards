import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {ILigue} from "../../interfaces/ILigue";
import {ICompetitionParticipant} from "../../interfaces/ICompetitionParticipant";
import {interval, startWith, Subscription, switchMap} from "rxjs";
import {IUtilisateur} from "../../interfaces/IUtilisateur";
import {AuthentificationService} from "../../services/authentification.service";
import {IAffrontement} from "../../interfaces/IAffrontement";
import {TournoiService} from "../../services/tournoi.service";

@Component({
  selector: 'app-details-ligue',
  templateUrl: './details-ligue.component.html',
  styleUrls: ['./details-ligue.component.css', '../../app.component.css']
})
export class DetailsLigueComponent implements OnInit, OnDestroy {

  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private subscription: Subscription | undefined;
  // @ts-ignore
  utilisateur: IUtilisateur;

  // @ts-ignore
  ligue: ILigue;
  players = signal<ICompetitionParticipant[]>([]);
  sortedPlayers = signal<ICompetitionParticipant[]>([]);
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
          switchMap(() => this.http.get<ILigue>(`${this.BACKEND_URL}/ligues/ligue?id=${ligueId}`))
        )
        .subscribe({
          next: ligue => this.updateLigueData(ligue),
          error: error => console.error('There was an error!', error),
        });
    });
  }

  private updateLigueData(ligue: ILigue) {
    this.ligue = ligue;

    const participants = ligue.participants.filter(p => p.utilisateur).sort(this.compareByPseudo);
    this.players.set(participants);

    this.hasAffrontement.set(this.checkIfAffrontement(this.utilisateur.id, ligue.affrontements));

    this.sortedPlayers.set([...participants].sort(this.comparePlayers));
  }

  playerInAffrontement(joueurId1: number, joueurId2: number): boolean {
    return (this.utilisateur.id === joueurId1 || this.utilisateur.id === joueurId2);
  }

  isAffrontement(joueurId1: number, joueurId2: number): boolean {
    return this.ligue?.affrontements.some(affrontement =>
      ((affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
      (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1))
    );
  }

  isAffrontementTermine(affrontement: IAffrontement | undefined): boolean {
    if (affrontement) {
      return affrontement.vainqueurId != null;
    } else {
      return true;
    }
  }

  private checkIfAffrontement(id: number, affrontements: IAffrontement[]) {
    return affrontements.some(affrontement => ((affrontement.joueur1Id === id || affrontement.joueur2Id === id) && affrontement.vainqueurId == null));
  }

  getScoreAffrontement(joueurId1: number, joueurId2: number): string {
    const affrontementRecherche = this.tournoiService.getAffrontement(joueurId1, joueurId2, this.ligue);

    if (affrontementRecherche) {
      return affrontementRecherche.scoreJ1 + ' - ' + affrontementRecherche.scoreJ2;
    } else {
      return 'A venir';
    }
  }

  compareByPseudo(a: ICompetitionParticipant, b: ICompetitionParticipant): number {
    if (a.utilisateur && b.utilisateur) {
      const pseudoA = a.utilisateur.pseudo.toUpperCase();
      const pseudoB = b.utilisateur.pseudo.toUpperCase();

      if (pseudoA < pseudoB) {
        return -1;
      }
      if (pseudoA > pseudoB) {
        return 1;
      }
      return 0;
    } else if (!a.utilisateur) {
     return 1;
    } else {
      return -1;
    }
  }

  comparePlayers(playerA: ICompetitionParticipant, playerB: ICompetitionParticipant): number {
    const victoriesA = this.getNombreVictoires(playerA.utilisateur.id);
    const victoriesB = this.getNombreVictoires(playerB.utilisateur.id);

    // Comparer le nombre de victoires
    if (victoriesB !== victoriesA) {
      return victoriesB - victoriesA; // Tri décroissant par nombre de victoires
    }

    const lostA = this.getNombreDefaites(playerA.utilisateur.id);
    const lostB = this.getNombreDefaites(playerB.utilisateur.id);

    // Comparer le nombre de défaites
    if (lostA !== lostB) {
      return lostA - lostB;
    }

    // En cas d'égalité, comparer le nombre de manches perdues
    const scoreA = this.getNombreManchesPerdues(playerA.utilisateur.id);
    const scoreB = this.getNombreManchesPerdues(playerB.utilisateur.id);

    return scoreA - scoreB; // Tri croissant par nombre de manches perdues
  }

  getNombreVictoires(joueurId: number): number {
    return this.ligue.affrontements.filter(affrontement => affrontement.vainqueurId === joueurId).length;
  }

  getNombreNuls(joueurId: number): number {
    return this.ligue.affrontements.filter(affrontement =>
      (affrontement.joueur1Id === joueurId || affrontement.joueur2Id === joueurId)
      && (affrontement.vainqueurId !== null && affrontement.vainqueurId === 0)).length;
  }

  getNombreDefaites(joueurId: number): number {
    return this.ligue.affrontements.filter(affrontement =>
      (affrontement.joueur1Id === joueurId || affrontement.joueur2Id === joueurId)
      && (affrontement.vainqueurId !== null && affrontement.vainqueurId !== 0 && affrontement.vainqueurId !== joueurId)).length;
  }

  getNombreManchesGagnees(joueurId: number): number {
    return this.ligue.affrontements
      .filter(affrontement =>
        ((affrontement.joueur1Id === joueurId || affrontement.joueur2Id === joueurId))
      )
      .reduce((totalManchesGagnees, affrontement) => {
        return totalManchesGagnees + ((affrontement.joueur1Id == joueurId) ? affrontement.scoreJ1 : affrontement.scoreJ2);
      }, 0);
  }

  getNombreManchesPerdues(joueurId: number): number {
    return this.ligue.affrontements
      .filter(affrontement =>
        ((affrontement.joueur1Id === joueurId || affrontement.joueur2Id === joueurId))
      )
      .reduce((totalManchesGagnees, affrontement) => {
        return totalManchesGagnees + ((affrontement.joueur1Id == joueurId) ? affrontement.scoreJ2 : affrontement.scoreJ1);
      }, 0);
  }

  getAffrontement(joueurId1: number, joueurId2: number): IAffrontement | undefined {
    if (this.ligue && this.ligue.affrontements) {
      return this.ligue.affrontements.find(affrontement =>
        (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
        (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1)
      );
    } else {
      return undefined;
    }
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number) {
    if (this.ligue) {
      this.tournoiService.openAffrontementPartie(joueurId1, joueurId2, this.ligue, this.authService.getUser());
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
