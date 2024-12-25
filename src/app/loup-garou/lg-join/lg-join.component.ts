import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {LgPartieService} from "../../services/lg-partie.service";

@Component({
  selector: 'app-lg-join',
  templateUrl: './lg-join.component.html',
  styleUrls: ['./lg-join.component.css', '../../app.component.css']
})
export class LgJoinComponent {
  nomJoueur: string = '';
  code: string = '';

  constructor(private router: Router, private lgPartieService: LgPartieService) {
  }

  rejoindre() {
    this.lgPartieService.joinGame(this.code, this.nomJoueur).subscribe(
      (response) => {
        console.log('Partie rejointe avec succès :', response.gameId);
        this.router.navigate(['lg/game', response.gameId, response.playerId]);
      },
      (error) => {
        console.error('Erreur lors de la récupération de la partie :', error);
      }
    );
  }

}
