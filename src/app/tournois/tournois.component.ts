import {Component, NgZone, OnInit, signal} from '@angular/core';
import {TournoiService} from "../services/tournoi.service";
import {Tournoi} from "../classes/competitions/Tournoi";
import {Ligue} from "../classes/competitions/Ligue";
import {AuthentificationService} from "../services/authentification.service";
import {UserAndLigue} from "../classes/competitions/UserAndLigue";
import {Utilisateur} from "../classes/Utilisateur";
import {LigueTournoiStatutEnum} from "../enums/LigueTournoiStatutEnum";
import {Router} from "@angular/router";
import {Deck} from "../classes/decks/Deck";
import {DialogService} from "primeng/dynamicdialog";
import {InscriptionDialogComponent} from "./inscription-dialog/inscription-dialog.component";
import {UtilisateurService} from "../services/utilisateur.service";
import {InscriptionCompetition} from "../classes/competitions/InscriptionCompetition";
import {UserAndTournoi} from "../classes/competitions/UserAndTournoi";
import { UiMessageService } from '../services/ui-message.service';
import { TOURNOIS_MSG } from '../core/messages/domain.messages';

@Component({
  selector: 'app-tournois',
  templateUrl: './tournois.component.html',
  styleUrls: ['./tournois.component.css', '../app.component.css']
})
export class TournoisComponent implements OnInit {
  tournoisOuverts= signal<Tournoi[]>([]);
  liguesOuvertes= signal<Ligue[]>([]);

  registeredTournaments= signal<Tournoi[]>([]);
  registeredLigues= signal<Ligue[]>([]);

  utilisateur = signal<Utilisateur | null>(null);

  allDecks= signal<Deck[]>([]);


  constructor(private router: Router, private zone: NgZone,
              private dialogService: DialogService, private tournoiService: TournoiService,
              private authService: AuthentificationService, private utilisateurService: UtilisateurService,
              private uiMessage: UiMessageService) {
  }

  ngOnInit(): void {
    this.utilisateur.set(this.authService.getUser());
    this.utilisateurService.getAllDecks().subscribe(playerDecks => {
      this.allDecks.set(playerDecks);
    });
    this.refreshTournoisLigueListes();
  }

  registerForTournament(tournoi: Tournoi) {
    this.zone.run(() => {
      const ref = this.dialogService.open(InscriptionDialogComponent, {
        header: 'Inscription pour ' + tournoi.nom,
        width: '60%',
        height: '60%',
        data: { competition: tournoi, decks: this.allDecks().filter(deck =>
            deck.formats.some(format => format.formatId === tournoi.format.formatId)
          )
        },
        closable: false
      });

      ref.onClose.subscribe((inscriptionCompetition: InscriptionCompetition) => {
        if (inscriptionCompetition.status === "OK") {
          const inscriptionValues: UserAndTournoi = { tournoi: tournoi, utilisateur: this.authService.getUser(), decks: inscriptionCompetition.decks };

          this.tournoiService.inscrireTournoi(inscriptionValues).subscribe({
            next: () => {
              this.uiMessage.success(TOURNOIS_MSG.INSCRIPTION_OK);
              this.refreshTournoisLigueListes();
            },
            error: () => {
              this.uiMessage.error(TOURNOIS_MSG.INSCRIPTION_ERR);
              this.refreshTournoisLigueListes();
            }
          });
        }
      });
    });
  }

  registerForLigue(ligue: Ligue) {
    this.zone.run(() => {
      const ref = this.dialogService.open(InscriptionDialogComponent, {
        header: 'Inscription pour ' + ligue.nom,
        width: '60%',
        height: '60%',
        data: { competition: ligue, decks: this.allDecks().filter(deck => deck.formats.some(format => format.formatId ===  ligue.format.formatId)) },
        closable: false
      });

      ref.onClose.subscribe((inscriptionCompetition: InscriptionCompetition) => {
        if (inscriptionCompetition.status === "OK") {
          // @ts-ignore
          const inscriptionValues: UserAndLigue = { ligue: ligue, utilisateur: this.authService.getUser(), decks: inscriptionCompetition.decks };

          this.tournoiService.inscrireLigue(inscriptionValues).subscribe({
            next: () => {
              this.uiMessage.success(TOURNOIS_MSG.INSCRIPTION_OK);
              this.refreshTournoisLigueListes();
            },
            error: () => {
              this.uiMessage.error(TOURNOIS_MSG.INSCRIPTION_ERR);
              this.refreshTournoisLigueListes();
            }
          });
        }
      });
    });
  }

  unregisterForTournament(tournoi: Tournoi) {
    // @ts-ignore
    const inscriptionValues: UserAndTournoi = { tournoi: tournoi, utilisateur: this.authService.getUser() };

    this.tournoiService.desinscrireTournoi(inscriptionValues).subscribe({
      next: () => {
        this.uiMessage.success(TOURNOIS_MSG.DESINSCRIPTION_OK);
        this.refreshTournoisLigueListes();
      },
      error: () => {
        this.uiMessage.error(TOURNOIS_MSG.DESINSCRIPTION_ERR);
        this.refreshTournoisLigueListes();
      }
    });
  }

  unregisterForLigue(ligue: Ligue) {
    // @ts-ignore
    const inscriptionValues: UserAndLigue = { ligue: ligue, utilisateur: this.authService.getUser() };

    this.tournoiService.desinscrireLigue(inscriptionValues).subscribe({
      next: () => {
        this.uiMessage.success(TOURNOIS_MSG.DESINSCRIPTION_OK);
        this.refreshTournoisLigueListes();
      },
      error: () => {
        this.uiMessage.error(TOURNOIS_MSG.DESINSCRIPTION_ERR);
        this.refreshTournoisLigueListes();
      }
    });
  }

  isUserInTournoiParticipants(tournoi: Tournoi): boolean {
    if (this.utilisateur()) {
      const utilisateur = this.utilisateur()!;
      return tournoi.participants.filter(player => player.utilisateur !== null).some(participant => participant.utilisateur.id === utilisateur.id);
    } else {
      return false;
    }
  }

  isUserInLigueParticipants(ligue: Ligue): boolean {
    if (this.utilisateur()) {
      const utilisateur = this.utilisateur()!;
      return ligue.participants.filter(player => player.utilisateur !== null).some(participant => participant.utilisateur.id === utilisateur.id);
    } else {
      return false;
    }
  }

  inscriptionTournoiOuverte(tournoi: Tournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  inscriptionLigueOuverte(ligue: Ligue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  isTournoiEnCours(tournoi: Tournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.EN_COURS;
  }

  isTournoiTermine(tournoi: Tournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.TERMINE;
  }

  isLigueEnCours(ligue: Ligue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.EN_COURS;
  }

  isLigueTermine(ligue: Ligue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.TERMINE;
  }

  refreshTournoisLigueListes() {
    this.tournoiService.getTournoisAVenir().subscribe({
      next: (data) => {
          this.tournoisOuverts.set(data);
        },
      error: () => {
        this.uiMessage.error(TOURNOIS_MSG.LISTE_ERR);
      }
    });

    this.tournoiService.getLiguesAVenir().subscribe({
      next: (data) => {
        this.liguesOuvertes.set(data);
      },
      error: () => {
        this.uiMessage.error(TOURNOIS_MSG.LISTE_ERR);
      }
    });

    if (this.utilisateur() !== null) {
      const utilisateur = this.utilisateur()!;
      this.tournoiService.getTournoisValidesForUser(utilisateur.id).subscribe({
        next: (data) => {
          this.registeredTournaments.set(data);
        },
        error: () => {
          this.uiMessage.error(TOURNOIS_MSG.LISTE_ERR);
        }
      });

      this.tournoiService.getLiguesValidesForUser(utilisateur.id).subscribe({
        next: (data) => {
          this.registeredLigues.set(data);
        },
        error: () => {
          this.uiMessage.error(TOURNOIS_MSG.LISTE_ERR);
        }
      });
    }
  }

  voirTournoi(tournoi: Tournoi) {
    this.router.navigate(['/tournoi', tournoi.id]);
  }

  voirLigue(ligue: Ligue) {
    this.router.navigate(['/ligue', ligue.id]);
  }
}
