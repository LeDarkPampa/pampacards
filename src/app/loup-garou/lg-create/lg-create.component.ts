import {Component} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-lg-create',
  templateUrl: './lg-create.component.html',
  styleUrls: ['./lg-create.component.css', '../../app.component.css']
})
export class LgCreateComponent {
  nbJoueursMax: number = 15;
  code: string = '';

  constructor(private router: Router) {
  }

  creerPartie() {
    this.router.navigate(['lg/game', 1]);
  }
}
