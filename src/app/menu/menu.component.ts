import {ChangeDetectorRef, Component} from '@angular/core';
import {AuthentificationService} from '../services/authentification.service';
import {first} from "rxjs";

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css', '../app.component.css']
})
export class MenuComponent {

  constructor(public authService: AuthentificationService, private cd: ChangeDetectorRef) {

  }

  isAdmin() {
    return this.authService.isAdmin();
  }

  async isLoggedIn(): Promise<boolean> {
    const isLoggedIn = await this.authService.isLoggedIn$.pipe(first()).toPromise();
    return !!isLoggedIn; // Convertir la valeur en un boolean avec l'opérateur double négation (!!).
  }

  logOut() {
    this.authService.logout();
    this.cd.detectChanges();
  }
}
