import {Component, OnInit} from '@angular/core';
import {TournoiService} from "../services/tournoi.service";
import {ITournoi} from "../interfaces/ITournoi";
import {ILigue} from "../interfaces/ILigue";

@Component({
  selector: 'app-tournois',
  templateUrl: './tournois.component.html',
  styleUrls: ['./tournois.component.css', '../app.component.css']
})
export class TournoisComponent implements OnInit {
  tournoisOuverts: ITournoi[] = [];
  registeredTournaments: any[] = [{nom: 'Cactus tournamen 4', statut: 'En attente'}, {nom: 'Cactus tournament 5', statut: 'En cours'},{nom: 'Cactus tournament 6', statut: 'En cours'}];
  liguesOuvertes: ILigue[] = [];


  constructor(private tournoiService: TournoiService) { }

  ngOnInit(): void {
    this.tournoiService.getTournoisInscriptionsOuvertes().subscribe(
      (data) => {
        this.tournoisOuverts = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    );

    this.tournoiService.getLiguesInscriptionsOuvertes().subscribe(
      (data) => {
        this.liguesOuvertes = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des tournois en attente :', error);
      }
    );

  }

  registerForTournament(tournament: any) {
    // Logique pour inscrire un joueur à un tournoi (à implémenter)
  }
}
