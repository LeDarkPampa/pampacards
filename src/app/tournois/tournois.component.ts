import {Component, OnInit} from '@angular/core';
import {TournoiService} from "../services/tournoi.service";

@Component({
  selector: 'app-tournois',
  templateUrl: './tournois.component.html',
  styleUrls: ['./tournois.component.css', '../app.component.css']
})
export class TournoisComponent implements OnInit {
  availableTournaments: any[] = [{name: 'Cactus tournament'}, {name: 'Cactus tournament 2'},{name: 'Cactus tournament 3'}];
  registeredTournaments: any[] = [{name: 'Cactus tournamen 4', status: 'En attente'}, {name: 'Cactus tournament 5', status: 'En cours'},{name: 'Cactus tournament 6', status: 'En cours'}];

  constructor(private tournoiService: TournoiService) { }

  ngOnInit(): void {
    this.tournoiService.getTournoisEnAttente().subscribe(
      (data) => {
        this.availableTournaments = data;
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
