import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";
import {ILigue} from "../../interfaces/ILigue";
import {ICompetitionParticipant} from "../../interfaces/ICompetitionParticipant";
import {interval, Observable, startWith, Subscription, switchMap, throwError} from "rxjs";
import {IUtilisateur} from "../../interfaces/IUtilisateur";
import {AuthentificationService} from "../../services/authentification.service";
import {IAffrontement} from "../../interfaces/IAffrontement";
import {IPartie} from "../../interfaces/IPartie";
import {DialogService} from "primeng/dynamicdialog";
import {IDeck} from "../../interfaces/IDeck";
import {OpenAffrontementDialogComponent} from "../open-affrontement-dialog/open-affrontement-dialog.component";
import {catchError} from "rxjs/operators";

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
  private API_BASE_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';
  private subscription: Subscription | undefined;

  constructor(private http: HttpClient, private route: ActivatedRoute, private zone: NgZone, private router: Router,
              private dialogService: DialogService, private authService: AuthentificationService) {

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

  openAffrontementPartie(joueurId1: number, joueurId2: number) {
    const affrontementRecherche = this.getAffrontement(joueurId1, joueurId2);

    if (affrontementRecherche && affrontementRecherche.vainqueurId == null) {
      const activePartieId = this.getActivePartieId(affrontementRecherche);

      if (activePartieId) {
        const url = this.API_BASE_URL + `/partie?partieId=${activePartieId}`;

        this.http.get<IPartie>(url).pipe(
          catchError(error => this.handleError(error))
        ).subscribe(partie => {
          if (partie && partie.id) {
            this.handlePartieNavigation(partie, affrontementRecherche);
          }
        });
      }
    }
  }

  getActivePartieId(affrontementRecherche: IAffrontement): number | undefined {
    switch (affrontementRecherche.scoreJ1 + affrontementRecherche.scoreJ2) {
      case 0:
        return affrontementRecherche.partie1Id;
      case 1:
        return affrontementRecherche.partie2Id;
      case 2:
        return affrontementRecherche.partie3Id;
      case 3:
        return affrontementRecherche.partie4Id;
      case 4:
        return affrontementRecherche.partie5Id;
      default:
        console.log("openAffrontementPartie: Cas non géré");
        return undefined;
    }
  }

  handlePartieNavigation(partie: IPartie, affrontement: IAffrontement): void {
    if (this.utilisateur.id == partie.joueurUn.id || this.utilisateur.id == partie.joueurDeux.id) {
      const decks = this.getDecksForUser(this.utilisateur.id, affrontement);

      if (decks) {
        this.zone.run(() => {
          const ref = this.dialogService.open(OpenAffrontementDialogComponent, {
            header: 'Choisir un deck',
            width: '30%',
            height: '50vh',
            data: { decks: decks }
          });

          ref.onClose.subscribe((deck: IDeck) => {
            if (deck) {
              const url = this.API_BASE_URL + `/partie?partieId=${partie.id}`;

              this.http.get<IPartie>(url).pipe(
                catchError(error => this.handleError(error))
              ).subscribe(partie => {
                if (partie && partie.id) {
                  this.router.navigate(['/partie', partie.id]);
                }
              });
            }
          });
        });
      } else {
        console.error('Aucun deck trouvé');
      }
    }
  }

  handleError(error: any): Observable<never> {
    console.error('There was an error!', error);
    return throwError('Erreur lors de la requête HTTP.');
  }

  getScoreAffrontement(joueurId1: number, joueurId2: number): string {
    const affrontementRecherche = this.getAffrontement(joueurId1, joueurId2);

    // @ts-ignore
    return affrontementRecherche.scoreJ1 + ' - ' + affrontementRecherche.scoreJ2;
  }

  getAffrontement(joueurId1: number, joueurId2: number) {
    const affrontementRecherche = this.ligue.affrontements.find(affrontement =>
      (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
      (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1)
    );
    return affrontementRecherche;
  }

  getDecksForUser(id: number, affrontement: IAffrontement): IDeck[] | undefined {
    let filteredDecks: IDeck[] = [];

    const participant = this.ligue.participants.find(participant => participant.utilisateur.id === id);

    // @ts-ignore
    const decks = participant.decks;

    if (affrontement.joueur1Id === this.utilisateur.id) {
      if (affrontement.statutDeck1J1) {
        filteredDecks.push(decks[0]);
      }
      if (affrontement.statutDeck2J1) {
        filteredDecks.push(decks[1]);
      }
      if (affrontement.statutDeck3J1) {
        filteredDecks.push(decks[2]);
      }
    } else {
      if (affrontement.statutDeck1J2) {
        filteredDecks.push(decks[0]);
      }
      if (affrontement.statutDeck2J2) {
        filteredDecks.push(decks[1]);
      }
      if (affrontement.statutDeck3J2) {
        filteredDecks.push(decks[2]);
      }
    }

    return filteredDecks;
  }
}
