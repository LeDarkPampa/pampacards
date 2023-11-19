import {ChangeDetectorRef, Component} from '@angular/core';
import {AuthentificationService} from '../services/authentification.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css', '../app.component.css']
})
export class MenuComponent {

  constructor(private authService: AuthentificationService, private cd: ChangeDetectorRef) {

  }

  isAdmin() {
    return this.authService.isAdmin();
  }

  isLoggedIn(): boolean {
    return this.authService.isLogged();
  }

  logOut() {
    this.authService.logout();
    this.cd.detectChanges();
  }
}
