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

    this.lgPartieService.createPartie(nbJoueursMax).pipe(
      concatMap((createResponse) => {
        return this.lgPartieService.joinGame(this.code, user.pseudo).pipe(
          catchError((joinError) => {
            console.error('Erreur lors de la récupération de la partie :', joinError);
            return of(null);
          })
        );
      }),
      catchError((createError) => {
        console.error('Erreur lors de la création de la partie :', createError);
        return of(null);
      })
    ).subscribe(
      (response) => {
        if (response) {
          this.router.navigate(['lg/game', response.gameId, response.playerId]);
        } else {
          console.error('Erreur dans la création ou la jonction à la partie');
        }
      }
    );
  }
}
