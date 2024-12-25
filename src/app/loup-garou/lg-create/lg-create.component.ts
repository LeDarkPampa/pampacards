import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {LgPartieService} from "../../services/lg-partie.service";
import {Utilisateur} from "../../classes/Utilisateur";
import {AuthentificationService} from "../../services/authentification.service";
import {concatMap, of} from "rxjs";
import {catchError} from "rxjs/operators";

@Component({
  selector: 'app-lg-create',
  templateUrl: './lg-create.component.html',
  styleUrls: ['./lg-create.component.css', '../../app.component.css']
})
export class LgCreateComponent {
  nbJoueursMax: number = 15;
  code: string = '';

  constructor(private router: Router, private lgPartieService: LgPartieService,
              private authService: AuthentificationService) {
  }

  creerPartie(nbJoueursMax: number) {
    const user: Utilisateur = this.authService.getUser();

    console.log('Game code:', this.code);

    this.lgPartieService.createPartie(nbJoueursMax).subscribe(
      (response) => {
        if (!this.code) {
          console.error('Le code de la partie est manquant.');
          return;
        }

        this.lgPartieService.joinGame(this.code, user.pseudo).subscribe(
          (response) => {
            console.log('Partie rejointe avec succès :', response.gameId);
            this.router.navigate(['lg/game', response.gameId, response.playerId]);
          },
          (error) => {
            console.error('Erreur lors de la récupération de la partie :', error);
          }
        );
      },
      (error) => {
        console.error('Erreur lors de la création de la partie :', error);
      }
    );
  }

}
