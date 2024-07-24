import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { ITournoi } from "../../interfaces/ITournoi";
import { ICompetitionParticipant } from "../../interfaces/ICompetitionParticipant";
import { interval, startWith, Subscription, switchMap } from "rxjs";
import {IAffrontement} from "../../interfaces/IAffrontement";
import {AuthentificationService} from "../../services/authentification.service";
import {TournoiService} from "../../services/tournoi.service";

@Component({
  selector: 'app-details-tournoi',
  templateUrl: './details-tournoi.component.html',
  styleUrls: ['./details-tournoi.component.css', '../../app.component.css']
})
export class DetailsTournoiComponent implements OnInit, OnDestroy {

  userId = 0;
  tournoiId: number = 0;
  tournoi: ITournoi | undefined;
  players: ICompetitionParticipant[] = [];
  affrontements: IAffrontement[] = [];

  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private subscription: Subscription | undefined;

  constructor(private http: HttpClient, private route: ActivatedRoute,
              private authService: AuthentificationService, private tournoiService: TournoiService) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tournoiId = params['id'];

      this.userId = this.authService.getUserId();

      this.subscription = interval(5000)
        .pipe(
          startWith(0),
          switchMap(() => this.http.get<ITournoi>(`${this.BACKEND_URL}/tournois/tournoi?id=` + this.tournoiId))
        )
        .subscribe({
          next: tournoi => {
            this.tournoi = tournoi;
            this.players = this.tournoi.participants;
            this.affrontements = this.tournoi.rounds[0].affrontements;
          },
          error: error => {
            console.error('There was an error!', error);
          }
        });
    });
  }

  findParticipantById(id: number): string {
    const participant = this.players.find(player => player.utilisateur.id == id);
    return participant ? participant.utilisateur.pseudo : 'Aucun';
  }

  playerInAffrontement(joueur1Id: number, joueur2Id: number): boolean {
    return (this.userId === joueur1Id || this.userId === joueur2Id);
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number) {
    if (this.tournoi) {
      this.tournoiService.openAffrontementPartie(joueurId1, joueurId2, this.tournoi, this.authService.getUser());
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
