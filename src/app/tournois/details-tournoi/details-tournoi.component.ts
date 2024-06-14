import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { ITournoi } from "../../interfaces/ITournoi";
import { ICompetitionParticipant } from "../../interfaces/ICompetitionParticipant";
import { interval, startWith, Subscription, switchMap } from "rxjs";
import {IAffrontement} from "../../interfaces/IAffrontement";
import {IRound} from "../../interfaces/IRound";

@Component({
  selector: 'app-details-tournoi',
  templateUrl: './details-tournoi.component.html',
  styleUrls: ['./details-tournoi.component.css', '../../app.component.css']
})
export class DetailsTournoiComponent implements OnInit, OnDestroy {

  tournoiId: number = 0;
  tournoi: ITournoi | undefined;
  players: ICompetitionParticipant[] = [];
  affrontements: IAffrontement[] = [];
  rounds: IRound[] = [];

  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private subscription: Subscription | undefined;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tournoiId = params['id'];

      this.subscription = interval(5000)
        .pipe(
          startWith(0),
          switchMap(() => this.http.get<ITournoi>(`${this.BACKEND_URL}/tournois/tournoi?id=` + this.tournoiId))
        )
        .subscribe({
          next: tournoi => {
            this.tournoi = tournoi;
            this.players = this.tournoi.participants;
            this.affrontements = this.tournoi.rounds[0].affrontements; // Assuming affrontements are directly available
            this.organizeRounds();
          },
          error: error => {
            console.error('There was an error!', error);
          }
        });
    });
  }

  organizeRounds() {
    if (this.tournoi) {
      // Reset rounds
      this.rounds = [];

      // Organize affrontements in pairs (assuming they are already in order)
      for (let i = 0; i < this.affrontements.length; i += 2) {
        // this.rounds.push({affrontements: this.affrontements});
      }
    }
  }

  findParticipantById(id: number): string {
    const participant = this.players.find(player => player.id === id);
    return participant ? participant.utilisateur.pseudo : 'Aucun';
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
