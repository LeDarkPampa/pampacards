import { Component } from '@angular/core';

@Component({
  selector: 'app-lg-join',
  templateUrl: './lg-join.component.html',
  styleUrls: ['./lg-join.component.css', '../../app.component.css']
})
export class LgJoinComponent {
  code: string = '';

  rejoindre() {
    // Get partie selon code. Si trouvée, on bouge d'écran. Sinon, message erreur
  }
}
