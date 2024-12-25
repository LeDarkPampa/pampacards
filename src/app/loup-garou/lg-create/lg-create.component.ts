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

    this.lgPartieService.createPartie(nbJoueursMax).subscribe(
      (response) => {
        console.log('Partie créée avec succès:', response);

        this.code = response.gameCode;

        console.log('Code de la partie:', this.code);

        if (!this.code) {
          console.error('Le code de la partie est manquant.');
          return;
        }

        this.lgPartieService.joinGame(this.code, user.pseudo).subscribe(
          (joinResponse) => {
            console.log('Partie rejointe avec succès :', joinResponse.gameId);
            this.router.navigate(['lg/game', joinResponse.gameId, joinResponse.playerId]);
          },
          (joinError) => {
            console.error('Erreur lors de la récupération de la partie :', joinError);
          }
        );
      },
      (createError) => {
        console.error('Erreur lors de la création de la partie :', createError);
      }
    );
  }

}
