import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";
import {ILigue} from "../../interfaces/ILigue";
import {ICompetitionParticipant} from "../../interfaces/ICompetitionParticipant";
import {interval, startWith, Subscription, switchMap} from "rxjs";
import {IUtilisateur} from "../../interfaces/IUtilisateur";
import {AuthentificationService} from "../../services/authentification.service";
import {IAffrontement} from "../../interfaces/IAffrontement";
import {IPartie} from "../../interfaces/IPartie";
import {DialogService} from "primeng/dynamicdialog";
import {IDeck} from "../../interfaces/IDeck";
import {OpenAffrontementDialogComponent} from "../open-affrontement-dialog/open-affrontement-dialog.component";
import {ICarte} from "../../interfaces/ICarte";
import {IEvenementPartie} from "../../interfaces/IEvenementPartie";

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

  playerInAffrontement(joueurId1: number, joueurId2: number): boolean {
    return (this.utilisateur.id === joueurId1 || this.utilisateur.id === joueurId2);
  }

  isAffrontement(joueurId1: number, joueurId2: number): boolean {
    return this.ligue.affrontements.some(affrontement =>
      ((affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
      (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1))
    );
  }

  private checkIfAffrontement(id: number, affrontements: IAffrontement[]) {
    return affrontements.some(affrontement => (affrontement.joueur1Id === id || affrontement.joueur2Id === id));
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number) {
    console.log('openAffrontementPartie');
    const affrontement = this.getAffrontement(joueurId1, joueurId2);

    if (affrontement && affrontement.vainqueurId == null) {
      console.log('affrontement && affrontement.vainqueurId == null');
      const activePartieId = this.getActivePartieId(affrontement);
      console.log('activePartieId = ' + activePartieId);

      if (activePartieId) {
        this.http.get<IPartie>(this.API_BASE_URL + '/partie?partieId=' + activePartieId).subscribe({
          next: partie => {
            if (partie && partie.id) {

              if ((partie.joueurUn.id === this.utilisateur.id && !partie.deckJoueurUnId) ||
                (partie.joueurDeux.id === this.utilisateur.id && !partie.deckJoueurDeuxId)) {
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
                        const deckMelange = this.melangerDeck(deck.cartes);

                        this.http.get<IEvenementPartie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvents?partieId=' + partie.id).subscribe({
                          next: evenementsPartie => {
                            // @ts-ignore
                            const lastEvent = evenementsPartie.at(-1);
                            if (lastEvent) {
                              let event;

                              if (partie.joueurUn.id === this.utilisateur.id) {
                                event = {
                                  partie: partie,
                                  tour: lastEvent.tour,
                                  joueurActifId: lastEvent.joueurActifId,
                                  premierJoueurId: lastEvent.premierJoueurId,
                                  status: "EN_ATTENTE",
                                  cartesDeckJoueurUn: JSON.stringify(deckMelange),
                                  cartesDeckJoueurDeux: lastEvent.cartesDeckJoueurDeux,
                                  cartesMainJoueurUn: lastEvent.cartesMainJoueurUn,
                                  cartesMainJoueurDeux: lastEvent.cartesMainJoueurDeux,
                                  cartesTerrainJoueurUn: lastEvent.cartesTerrainJoueurUn,
                                  cartesTerrainJoueurDeux: lastEvent.cartesTerrainJoueurDeux,
                                  cartesDefausseJoueurUn: lastEvent.cartesDefausseJoueurUn,
                                  cartesDefausseJoueurDeux: lastEvent.cartesDefausseJoueurDeux,
                                  deckJoueurUnId: deck.id,
                                  deckJoueurDeuxId: lastEvent.deckJoueurDeuxId
                                };
                              }

                              if (partie.joueurDeux.id === this.utilisateur.id) {
                                event = {
                                  partie: partie,
                                  tour: lastEvent.tour,
                                  joueurActifId: lastEvent.joueurActifId,
                                  premierJoueurId: lastEvent.premierJoueurId,
                                  status: "EN_ATTENTE",
                                  cartesDeckJoueurUn: lastEvent.cartesDeckJoueurUn,
                                  cartesDeckJoueurDeux: JSON.stringify(deckMelange),
                                  cartesMainJoueurUn: lastEvent.cartesMainJoueurUn,
                                  cartesMainJoueurDeux: lastEvent.cartesMainJoueurDeux,
                                  cartesTerrainJoueurUn: lastEvent.cartesTerrainJoueurUn,
                                  cartesTerrainJoueurDeux: lastEvent.cartesTerrainJoueurDeux,
                                  cartesDefausseJoueurUn: lastEvent.cartesDefausseJoueurUn,
                                  cartesDefausseJoueurDeux: lastEvent.cartesDefausseJoueurDeux,
                                  deckJoueurUnId: lastEvent.deckJoueurUnId,
                                  deckJoueurDeuxId: deck.id
                                };
                              }

                              this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
                                next: response => {
                                  this.router.navigate(['/partie', partie.id]);
                                },
                                error: error => {
                                  console.error('There was an error!', error);
                                }
                              });
                            }
                          },
                          error: error => {
                            console.error('There was an error!', error);
                          }
                        });
                      }
                    });
                  });
                } else {
                  console.error('Aucun deck trouvé');
                }
              } else {
                this.router.navigate(['/partie', partie.id]);
              }
            } else {
              console.error('Aucune partie trouvée');
            }
          },
          error: error => {
            console.error('There was an error!', error);
          }
        });
      }
    }
  }

  getActivePartieId(affrontement: IAffrontement): number | undefined {
    console.log("affrontementRecherche.scoreJ1 + affrontementRecherche.scoreJ2 = " + (affrontement.scoreJ1 + affrontement.scoreJ2));
    switch (affrontement.scoreJ1 + affrontement.scoreJ2) {
      case 0:
        console.log("partie 1 : " + affrontement.partie1Id);
        return affrontement.partie1Id;
      case 1:
        console.log("partie 2 : " + affrontement.partie2Id);
        return affrontement.partie2Id;
      case 2:
        console.log("partie 3 : " + affrontement.partie3Id);
        return affrontement.partie3Id;
      case 3:
        console.log("partie 4 : " + affrontement.partie4Id);
        return affrontement.partie4Id;
      case 4:
        console.log("partie 5 : " + affrontement.partie5Id);
        return affrontement.partie5Id;
      default:
        console.log("openAffrontementPartie: Cas non géré");
        return undefined;
    }
  }
  getScoreAffrontement(joueurId1: number, joueurId2: number): string {
    const affrontementRecherche = this.getAffrontement(joueurId1, joueurId2);

    if (affrontementRecherche) {
      return affrontementRecherche.scoreJ1 + ' - ' + affrontementRecherche.scoreJ2;
    } else {
      return 'A venir';
    }
  }

  getAffrontement(joueurId1: number, joueurId2: number) {
    return this.ligue.affrontements.find(affrontement =>
      (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
      (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1)
    );
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

  private melangerDeck(deck: ICarte[]) {
    for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
    return deck;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
