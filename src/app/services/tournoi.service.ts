import {Injectable, NgZone} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable} from "rxjs";
import {Tournoi} from "../classes/competitions/Tournoi";
import {Ligue} from "../classes/competitions/Ligue";
import {Partie} from "../classes/parties/Partie";
import {OpenAffrontementDialogComponent} from "../tournois/open-affrontement-dialog/open-affrontement-dialog.component";
import {Deck} from "../classes/decks/Deck";
import {EvenementPartie} from "../classes/parties/EvenementPartie";
import {Utilisateur} from "../classes/Utilisateur";
import {Router} from "@angular/router";
import {DialogService} from "primeng/dynamicdialog";
import {ApiService} from "./api.service";
import {Carte} from "../classes/cartes/Carte";
import {Affrontement} from "../classes/combats/Affrontement";

@Injectable({
  providedIn: 'root'
})
export class TournoiService extends ApiService {

  constructor(private http: HttpClient, private zone: NgZone, private router: Router, private dialogService: DialogService) {
    super();
  }

  getTournoi(id: number): Observable<Tournoi> {
    return this.http.get<Tournoi>(`${this.BACKEND_URL}/tournois/tournoi?id=${id}`);
  }

  getLigue(id: number): Observable<Ligue> {
    return this.http.get<Ligue>(`${this.BACKEND_URL}/ligues/ligue?id=${id}`);
  }

  getAllTournois(): Observable<Tournoi[]> {
    return this.http.get<Tournoi[]>(`${this.BACKEND_URL}/tournois/all`);
  }

  getTournoisAVenir(): Observable<Tournoi[]> {
    return this.http.get<Tournoi[]>(`${this.BACKEND_URL}/tournois/tournois-a-venir`);
  }

  getTournoisValidesForUser(userId: number): Observable<Tournoi[]> {
    return this.http.get<Tournoi[]>(`${this.BACKEND_URL}/tournois/tournois-valides?userId=` + userId);
  }

  saveTournoi(newTournoi: Tournoi): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/tournois`, newTournoi);
  }

  deleteTournoi(id: number): Observable<any> {
    return this.http.delete(`${this.BACKEND_URL}/tournois/${id}`);
  }

  getAllLigues(): Observable<Ligue[]> {
    return this.http.get<Ligue[]>(`${this.BACKEND_URL}/ligues/all`);
  }

  getLiguesAVenir(): Observable<Ligue[]> {
    return this.http.get<Ligue[]>(`${this.BACKEND_URL}/ligues/ligues-a-venir`);
  }

  getLiguesValidesForUser(userId: number): Observable<Ligue[]> {
    return this.http.get<Ligue[]>(`${this.BACKEND_URL}/ligues/ligues-valides?userId=` + userId);
  }

  saveLigue(newLigue: Ligue): Observable<any> {
    return this.http.post(`${this.BACKEND_URL}/ligues`, newLigue);
  }

  deleteLigue(id: number): Observable<any> {
    return this.http.delete(`${this.BACKEND_URL}/ligues/${id}`);
  }

  openAffrontementPartie(joueurId1: number, joueurId2: number, competition: Ligue | Tournoi, utilisateur: Utilisateur) {
    const affrontement = this.getAffrontement(joueurId1, joueurId2, competition);
    if (affrontement && affrontement.vainqueurId == null) {
      const activePartieId = this.getActivePartieId(affrontement);
      if (activePartieId) {
        this.http.get<Partie>(this.API_URL + '/partie?partieId=' + activePartieId).subscribe({
          next: partie => {
            if (partie && partie.id) {

              if ((partie.joueurUn?.id === utilisateur?.id && !partie.deckJoueurUnId) ||
                (partie.joueurDeux?.id === utilisateur?.id && !partie.deckJoueurDeuxId)) {
                const decks = this.getDecksToSelectForUser(utilisateur?.id, affrontement, competition, utilisateur);

                if (decks) {
                  this.zone.run(() => {
                    const ref = this.dialogService.open(OpenAffrontementDialogComponent, {
                      header: 'Choisir un deck',
                      width: '30%',
                      height: '50vh',
                      data: { decks: decks }
                    });

                    ref.onClose.subscribe((deck: Deck) => {
                      if (deck) {
                        const deckMelange = this.melangerDeck(deck.cartes);

                        this.http.get<EvenementPartie[]>(this.API_URL + '/partieEvents?partieId=' + partie.id).subscribe({
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

                              this.http.post<any>(this.API_URL + '/partieEvent', event).subscribe({
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
  getAffrontement(joueurId1: number, joueurId2: number, competition: Ligue | Tournoi): Affrontement {
    if (this.isTournoi(competition)) {
      // Si competition est de type Tournoi, recherchez dans les rounds
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

  getActivePartieId(affrontement: Affrontement): number | undefined {
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

  getDecksToSelectForUser(id: number, affrontement: Affrontement, competition: Ligue | Tournoi, utilisateur: Utilisateur): Deck[] | undefined {
    let filteredDecks: Deck[] = [];

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

  private melangerDeck(deck: Carte[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  isTournoi(competition: Ligue | Tournoi): competition is Tournoi {
    return (competition as Tournoi).rounds !== undefined;
  }

  isTournoiTermine(tournoi: Tournoi): boolean {
    if (tournoi) {
      for (const round of tournoi.rounds) {
        for (const affrontement of round.affrontements) {
          if (affrontement.vainqueurId == null) {
            return false;
          }
        }
      }
      return true;
    } else {
      return false;
    }
  }

  getTournoiVainqueurId(tournoi: Tournoi): number {
    if (tournoi) {
      if (tournoi.rounds.length === 0) {
        return 0; // Si le tournoi n'a pas de rounds, retourner 0
      }

      // Trouver le round avec le numéro le plus élevé
      const dernierRound = tournoi.rounds.reduce((prev, current) => {
        return (prev.roundNumber > current.roundNumber) ? prev : current;
      });

      // Vérifier si le dernier round a des affrontements et retourner le vainqueurId du premier affrontement trouvé
      for (const affrontement of dernierRound.affrontements) {
        if (affrontement.vainqueurId) {
          return affrontement.vainqueurId;
        }
      }
    }

    // Si aucun vainqueurId n'est trouvé dans les affrontements du dernier round, retourner 0
    return 0;
  }
}
