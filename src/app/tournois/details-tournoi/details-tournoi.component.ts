import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { Tournoi } from "../../classes/competitions/Tournoi";
import { CompetitionParticipant } from "../../classes/competitions/CompetitionParticipant";
import { interval, startWith, Subscription, switchMap } from "rxjs";
import {AuthentificationService} from "../../services/authentification.service";
import {TournoiService} from "../../services/tournoi.service";
import {Affrontement} from "../../classes/combats/Affrontement";

@Component({
  selector: 'app-details-tournoi',
  templateUrl: './details-tournoi.component.html',
  styleUrls: ['./details-tournoi.component.css', '../../app.component.css']
})
export class DetailsTournoiComponent implements OnInit, OnDestroy {

  userId = 0;
  tournoi= signal<Tournoi | null>(null);
  players= signal<CompetitionParticipant[]>([]);

  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private subscription: Subscription | undefined;

  constructor(private http: HttpClient, private route: ActivatedRoute,
              private authService: AuthentificationService, private tournoiService: TournoiService) { }

  ngOnInit() {
    // On met à jour l'affichage de l'écran toutes les 5 secondes
    this.route.params.subscribe(params => {
      const tournoiId = params['id'];

      this.userId = this.authService.getUserId();

      this.subscription = interval(5000)
        .pipe(
          startWith(0),
          switchMap(() => this.http.get<Tournoi>(`${this.BACKEND_URL}/tournois/tournoi?id=` + tournoiId))
        )
        .subscribe({
          next: tournoi => {
            this.tournoi.set(tournoi);
            this.players.set(tournoi.participants);
          },
          error: error => {
            console.error('There was an error!', error);
          }
        });
    });
  }

  findParticipantById(id: number): string {
    const participant = this.players().find(player => player.utilisateur.id == id);
    return participant ? participant.utilisateur.pseudo : 'Aucun';
  }

  playerInAffrontement(joueur1Id: number, joueur2Id: number): boolean {
    return (this.userId === joueur1Id || this.userId === joueur2Id);
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number) {
    if (this.tournoi()) {
      const tournoi = this.tournoi()!;
      this.tournoiService.openAffrontementPartie(joueurId1, joueurId2, tournoi, this.authService.getUser());
    }
  }

  isAffontementTermine(affrontement: Affrontement) {
    return (affrontement.vainqueurId != null);
  }

  isTournoiTermine(tournoi: Tournoi): boolean {
    return this.tournoiService.isTournoiTermine(tournoi);
  }

  getTournoiVainqueurId(tournoi: Tournoi): number {
    return this.tournoiService.getTournoiVainqueurId(tournoi);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
