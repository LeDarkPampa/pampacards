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
        if (response.gameId && response.playerId) {

          const url = `/lg/game/${response.gameId}/${response.playerId}`;
          this.router.navigateByUrl(url);
          console.log('Partie rejointe avec succès :', response.gameId);
        } else {
          console.error('Les paramètres de la partie ou du joueur sont manquants.');
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération de la partie :', error);
      }
    );
  }

}
