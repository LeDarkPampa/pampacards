import {Component, NgZone, OnInit, signal} from '@angular/core';
import {TournoiService} from "../services/tournoi.service";
import {ITournoi} from "../interfaces/ITournoi";
import {ILigue} from "../interfaces/ILigue";
import {AuthentificationService} from "../services/authentification.service";
import { HttpClient } from "@angular/common/http";
import {IUserAndTournoi} from "../interfaces/IUserAndTournoi";
import {IUserAndLigue} from "../interfaces/IUserAndLigue";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {LigueTournoiStatutEnum} from "../interfaces/LigueTournoiStatutEnum";
import {Router} from "@angular/router";
import {IDeck} from "../interfaces/IDeck";
import {DialogService} from "primeng/dynamicdialog";
import {InscriptionDialogComponent} from "./inscription-dialog/inscription-dialog.component";
import {DeckService} from "../services/deck.service";
import {IinscriptionCompetition} from "../interfaces/IinscriptionCompetition";
import {UtilisateurService} from "../services/utilisateur.service";

@Component({
  selector: 'app-tournois',
  templateUrl: './tournois.component.html',
  styleUrls: ['./tournois.component.css', '../app.component.css']
})
export class TournoisComponent implements OnInit {
  tournoisOuverts= signal<ITournoi[]>([]);
  liguesOuvertes= signal<ILigue[]>([]);

  registeredTournaments= signal<ITournoi[]>([]);
  registeredLigues= signal<ILigue[]>([]);

  utilisateur = signal<IUtilisateur | null>(null);

  allDecks= signal<IDeck[]>([]);


  constructor(private http: HttpClient, private router: Router, private zone: NgZone,
              private dialogService: DialogService, private tournoiService: TournoiService,
              private authService: AuthentificationService, private utilisateurService: UtilisateurService) {
  }

  ngOnInit(): void {
    this.utilisateur.set(this.authService.getUser());
    this.utilisateurService.getAllDecks().subscribe(playerDecks => {
      this.allDecks.set(playerDecks);
    });
    this.refreshTournoisLigueListes();
  }

  registerForTournament(tournoi: ITournoi) {
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

      ref.onClose.subscribe((inscriptionCompetition: IinscriptionCompetition) => {
        if (inscriptionCompetition.status === "OK") {
          const inscriptionValues: IUserAndTournoi = { tournoi: tournoi, utilisateur: this.authService.getUser(), decks: inscriptionCompetition.decks };

          this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/tournois/inscription', inscriptionValues).subscribe({
            next: response => {
              alert('Inscription enregistrée !');
              this.refreshTournoisLigueListes();
            },
            error: error => {
              console.error('There was an error!', error);
              alert('Erreur lors de l\'inscription');
              this.refreshTournoisLigueListes();
            }
          });
        }
      });
    });
  }

  registerForLigue(ligue: ILigue) {
    this.zone.run(() => {
      const ref = this.dialogService.open(InscriptionDialogComponent, {
        header: 'Inscription pour ' + ligue.nom,
        width: '60%',
        height: '60%',
        data: { competition: ligue, decks: this.allDecks().filter(deck => deck.formats.some(format => format.formatId ===  ligue.format.formatId)) },
        closable: false
      });

      ref.onClose.subscribe((inscriptionCompetition: IinscriptionCompetition) => {
        if (inscriptionCompetition.status === "OK") {
          // @ts-ignore
          const inscriptionValues: IUserAndLigue = { ligue: ligue, utilisateur: this.authService.getUser(), decks: inscriptionCompetition.decks };

          this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/ligues/inscription', inscriptionValues).subscribe({
            next: response => {
              alert('Inscription enregistrée !');
              this.refreshTournoisLigueListes();
            },
            error: error => {
              console.error('There was an error!', error);
              alert('Erreur lors de l\'inscription');
              this.refreshTournoisLigueListes();
            }
          });
        }
      });
    });
  }

  unregisterForTournament(tournoi: ITournoi) {
    // @ts-ignore
    const inscriptionValues: IUserAndTournoi = { tournoi: tournoi, utilisateur: this.authService.getUser() };

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/tournois/desinscription', inscriptionValues).subscribe({
      next: response => {
        alert('Désinscription validée !');
        this.refreshTournoisLigueListes();
      },
      error: error => {
        console.error('There was an error!', error);
        this.refreshTournoisLigueListes();
      }
    });
  }

  unregisterForLigue(ligue: ILigue) {
    // @ts-ignore
    const inscriptionValues: IUserAndLigue = { ligue: ligue, utilisateur: this.authService.getUser() };

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/ligues/desinscription', inscriptionValues).subscribe({
      next: response => {
        alert('Désinscription validée !');
        this.refreshTournoisLigueListes();
      },
      error: error => {
        console.error('There was an error!', error);
        this.refreshTournoisLigueListes();
      }
    });
  }

  isUserInTournoiParticipants(tournoi: ITournoi): boolean {
    if (this.utilisateur()) {
      const utilisateur = this.utilisateur()!;
      return tournoi.participants.filter(player => player.utilisateur !== null).some(participant => participant.utilisateur.id === utilisateur.id);
    } else {
      return false;
    }
  }

  isUserInLigueParticipants(ligue: ILigue): boolean {
    if (this.utilisateur()) {
      const utilisateur = this.utilisateur()!;
      return ligue.participants.filter(player => player.utilisateur !== null).some(participant => participant.utilisateur.id === utilisateur.id);
    } else {
      return false;
    }
  }

  inscriptionTournoiOuverte(tournoi: ITournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  inscriptionLigueOuverte(ligue: ILigue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  isTournoiEnCours(tournoi: ITournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.EN_COURS;
  }

  isTournoiTermine(tournoi: ITournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.TERMINE;
  }

  isLigueEnCours(ligue: ILigue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.EN_COURS;
  }

  isLigueTermine(ligue: ILigue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.TERMINE;
  }

  refreshTournoisLigueListes() {
    this.tournoiService.getTournoisAVenir().subscribe({
      next: (data) => {
          this.tournoisOuverts.set(data);
        },
      error: (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    });

    this.tournoiService.getLiguesAVenir().subscribe({
      next: (data) => {
        this.liguesOuvertes.set(data);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    });

    if (this.utilisateur() !== null) {
      const utilisateur = this.utilisateur()!;
      this.tournoiService.getTournoisValidesForUser(utilisateur.id).subscribe({
        next: (data) => {
          this.registeredTournaments.set(data);
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des tournois en attente :', error);
        }
      });

      this.tournoiService.getLiguesValidesForUser(utilisateur.id).subscribe({
        next: (data) => {
          this.registeredLigues.set(data);
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des tournois en attente :', error);
        }
      });
    }
  }

  voirTournoi(tournoi: ITournoi) {
    this.router.navigate(['/tournoi', tournoi.id]);
  }

  voirLigue(ligue: ILigue) {
    this.router.navigate(['/ligue', ligue.id]);
  }
}
