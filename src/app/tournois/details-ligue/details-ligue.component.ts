import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {ILigue} from "../../interfaces/ILigue";
import {ICompetitionParticipant} from "../../interfaces/ICompetitionParticipant";
import {interval, startWith, Subscription, switchMap} from "rxjs";

@Component({
  selector: 'app-details-ligue',
  templateUrl: './details-ligue.component.html',
  styleUrls: ['./details-ligue.component.css', '../../app.component.css']
})
export class DetailsLigueComponent implements OnInit, OnDestroy {

  ligueId: number = 0;
  // @ts-ignore
  ligue: ILigue;
  players: ICompetitionParticipant[] = [];
  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private subscription: Subscription | undefined;

  constructor(private http: HttpClient, private route: ActivatedRoute) {

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.ligueId = params['id'];
      this.subscription = interval(5000)
        .pipe(
          startWith(0),
          switchMap(() => this.http.get<ILigue>(`${this.BACKEND_URL}/ligues/ligue?id=` + this.ligueId))
        )
        .subscribe({
          next: ligue => {
            this.ligue = ligue;
            this.players = this.ligue.participants;
          },
          error: error => {
            console.error('There was an error!', error);
          }
        });
    });
  }

  hasAffrontement(joueurId1: number, joueurId2: number): boolean {
    return this.ligue.affrontements.some(affrontement =>
      (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
      (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1)
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
