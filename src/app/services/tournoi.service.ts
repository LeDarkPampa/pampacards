import {Injectable, NgZone} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ITournoi} from "../interfaces/ITournoi";
import {ILigue} from "../interfaces/ILigue";
import {IPartie} from "../interfaces/IPartie";
import {OpenAffrontementDialogComponent} from "../tournois/open-affrontement-dialog/open-affrontement-dialog.component";
import {IDeck} from "../interfaces/IDeck";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {IAffrontement} from "../interfaces/IAffrontement";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {Router} from "@angular/router";
import {DialogService} from "primeng/dynamicdialog";
import {ICarte} from "../interfaces/ICarte";

@Injectable({
  providedIn: 'root'
})
export class TournoiService {
  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  private API_BASE_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';

  constructor(private http: HttpClient, private zone: NgZone, private router: Router, private dialogService: DialogService) { }

  getAllTournois(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/all`);
  }

  getTournoisAVenir(): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/tournois-a-venir`);
  }

  getTournoisValidesForUser(userId: number): Observable<ITournoi[]> {
    return this.http.get<ITournoi[]>(`${this.BACKEND_URL}/tournois/tournois-valides?userId=` + userId);
  }

  saveTournoi(newTournoi: ITournoi): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/tournois`, newTournoi);
  }

  deleteTournoi(id: number): Observable<any> {
    return this.http.delete(`${this.BACKEND_URL}/tournois/${id}`);
  }

  getAllLigues(): Observable<ILigue[]> {
    return this.http.get<ILigue[]>(`${this.BACKEND_URL}/ligues/all`);
  }

  getLiguesAVenir(): Observable<ILigue[]> {
    return this.http.get<ILigue[]>(`${this.BACKEND_URL}/ligues/ligues-a-venir`);
  }

  getLiguesValidesForUser(userId: number): Observable<ILigue[]> {
    return this.http.get<ILigue[]>(`${this.BACKEND_URL}/ligues/ligues-valides?userId=` + userId);
  }

  saveLigue(newLigue: ILigue): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/ligues`, newLigue);
  }

  deleteLigue(id: number): Observable<any> {
    return this.http.delete(`${this.BACKEND_URL}/ligues/${id}`);
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number, competition: ILigue | ITournoi, utilisateur: IUtilisateur) {
    const affrontement = this.getAffrontement(joueurId1, joueurId2, competition);
    if (affrontement && affrontement.vainqueurId == null) {
      const activePartieId = this.getActivePartieId(affrontement);
      if (activePartieId) {
        this.http.get<IPartie>(this.API_BASE_URL + '/partie?partieId=' + activePartieId).subscribe({
          next: partie => {
            if (partie && partie.id) {

              if ((partie.joueurUn?.id === utilisateur?.id && !partie.deckJoueurUnId) ||
                (partie.joueurDeux?.id === utilisateur?.id && !partie.deckJoueurDeuxId)) {
                const decks = this.getDecksForUser(utilisateur?.id, affrontement, competition, utilisateur);

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

                              if (partie.joueurUn.id === utilisateur.id) {
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

                              if (partie.joueurDeux.id === utilisateur.id) {
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

  // @ts-ignore
  getAffrontement(joueurId1: number, joueurId2: number, competition: ILigue | ITournoi): IAffrontement {
    if (this.isTournoi(competition)) {
      // Si competition est de type ITournoi, recherchez dans les rounds
      for (const round of competition.rounds) {
        const affrontement = round.affrontements.find(affrontement => {
            return (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
              (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1);
          }
        );
        if (affrontement) {
          return affrontement;
        }
      }
    } else {
      // @ts-ignore
      return competition.affrontements.find(affrontement =>
        (affrontement.joueur1Id === joueurId1 && affrontement.joueur2Id === joueurId2) ||
        (affrontement.joueur1Id === joueurId2 && affrontement.joueur2Id === joueurId1)
      );
    }
  }

  getActivePartieId(affrontement: IAffrontement): number | undefined {
    switch (affrontement.scoreJ1 + affrontement.scoreJ2) {
      case 0:
        return affrontement.partie1Id;
      case 1:
        return affrontement.partie2Id;
      case 2:
        return affrontement.partie3Id;
      case 3:
        return affrontement.partie4Id;
      case 4:
        return affrontement.partie5Id;
      default:
        console.log("openAffrontementPartie: Cas non géré");
        return undefined;
    }
  }

  getDecksForUser(id: number, affrontement: IAffrontement, competition: ILigue | ITournoi, utilisateur: IUtilisateur): IDeck[] | undefined {
    let filteredDecks: IDeck[] = [];

    const participant = competition.participants.filter(player => player.utilisateur !== null).find(participant => participant.utilisateur.id === id);

    // @ts-ignore
    const decks = participant.decks;

    if (affrontement.joueur1Id === utilisateur.id) {
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

  isTournoi(competition: ILigue | ITournoi): competition is ITournoi {
    return (competition as ITournoi).rounds !== undefined;
  }
}
