import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {LgPartieService} from "../../services/lg-partie.service";

@Component({
  selector: 'app-lg-create',
  templateUrl: './lg-create.component.html',
  styleUrls: ['./lg-create.component.css', '../../app.component.css']
})
export class LgCreateComponent {
  nbJoueursMax: number = 15;
  code: string = '';

  constructor(private router: Router, private lgPartieService: LgPartieService) {
  }

  creerPartie(nbJoueursMax: number) {
    this.lgPartieService.createPartie(nbJoueursMax).subscribe(
      (response) => {
        console.log('Partie créée avec succès :', response.gameId);
        this.router.navigate(['lg/game', response.gameId]);
      },
      (error) => {
        console.error('Erreur lors de la création de la partie :', error);
      }
    );
  }
}
