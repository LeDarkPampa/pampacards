import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {ILigue} from "../../interfaces/ILigue";
import {ICompetitionParticipant} from "../../interfaces/ICompetitionParticipant";
import {interval, startWith, Subscription, switchMap} from "rxjs";
import {IUtilisateur} from "../../interfaces/IUtilisateur";
import {AuthentificationService} from "../../services/authentification.service";
import {IAffrontement} from "../../interfaces/IAffrontement";

@Component({
  selector: 'app-details-ligue',
  templateUrl: './details-ligue.component.html',
  styleUrls: ['./details-ligue.component.css', '../../app.component.css']
})
export class DetailsLigueComponent implements OnInit, OnDestroy {

  // @ts-ignore
  utilisateur: IUtilisateur;
  ligueId: number = 0;
  // @ts-ignore
  ligue: ILigue;
  players: ICompetitionParticipant[] = [];
  hasAffrontement: boolean = false;
  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private subscription: Subscription | undefined;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService) {

  }

  ngOnInit() {
    // @ts-ignore
    this.utilisateur = this.authService.getUser();
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
            this.hasAffrontement = this.checkIfAffrontement(this.utilisateur.id, this.ligue.affrontements);
          },
          error: error => {
            console.error('There was an error!', error);
          }
        });
    });
  }

  isAffrontement(joueurId1: number, joueurId2: number): boolean {
    return this.ligue.affrontements.some(affrontement =>
      (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
      (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1)
    );
  }

  private checkIfAffrontement(id: number, affrontements: IAffrontement[]) {
    return affrontements.some(affrontement => (affrontement.joueur1Id === id || affrontement.joueur2Id === id));
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
