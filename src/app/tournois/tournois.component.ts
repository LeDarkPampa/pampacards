import {Component, OnInit} from '@angular/core';
import {TournoiService} from "../services/tournoi.service";
import {ITournoi} from "../interfaces/ITournoi";
import {ILigue} from "../interfaces/ILigue";
import {AuthentificationService} from "../services/authentification.service";
import {HttpClient} from "@angular/common/http";
import {IUserAndTournoi} from "../interfaces/IUserAndTournoi";
import {IUserAndLigue} from "../interfaces/IUserAndLigue";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {LigueTournoiStatutEnum} from "../interfaces/LigueTournoiStatutEnum";

@Component({
  selector: 'app-tournois',
  templateUrl: './tournois.component.html',
  styleUrls: ['./tournois.component.css', '../app.component.css']
})
export class TournoisComponent implements OnInit {
  tournoisOuverts: ITournoi[] = [];
  liguesOuvertes: ILigue[] = [];

  registeredTournaments: ITournoi[] = [];
  registeredLigues: ILigue[] = [];

  // @ts-ignore
  utilisateur: IUtilisateur;


  constructor(private http: HttpClient, private tournoiService: TournoiService, private authService: AuthentificationService) {
  }

  ngOnInit(): void {
    // @ts-ignore
    this.utilisateur = this.authService.getUser();
    this.refreshTournoisLigueListes();
  }

  registerForTournament(tournoi: ITournoi) {
    // @ts-ignore
    const inscriptionValues: IUserAndTournoi = { tournoi: tournoi, utilisateur: this.authService.getUser() };

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

  registerForLigue(ligue: ILigue) {
    // @ts-ignore
    const inscriptionValues: IUserAndLigue = { ligue: ligue, utilisateur: this.authService.getUser() };

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
        alert('Erreur lors de la desinscription');
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
        alert('Erreur lors de la desinscription');
        this.refreshTournoisLigueListes();
      }
    });
  }

  isUserInParticipants(tournoi: ITournoi): boolean {
    return tournoi.participants.some(participant => participant.id === this.utilisateur.id);
  }

  isUserInLigueParticipants(ligue: ILigue): boolean {
    return ligue.participants.some(participant => participant.id === this.utilisateur.id);
  }

  inscriptionTournoiOuverte(tournoi: ITournoi): boolean {
    return tournoi.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  inscriptionLigueOuverte(ligue: ILigue): boolean {
    return ligue.statut === LigueTournoiStatutEnum.INSCRIPTIONS_OUVERTES;
  }

  refreshTournoisLigueListes() {
    this.tournoiService.getTournoisAVenir().subscribe(
      (data) => {
        this.tournoisOuverts = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    );

    this.tournoiService.getLiguesAVenir().subscribe(
      (data) => {
        this.liguesOuvertes = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    );

    this.tournoiService.getTournoisValidesForUser(this.utilisateur.id).subscribe(
      (data) => {
        this.registeredTournaments = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    );

    this.tournoiService.getLiguesValidesForUser(this.utilisateur.id).subscribe(
      (data) => {
        this.registeredLigues = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    );
  }
}
