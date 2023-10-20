import { Component } from '@angular/core';
import {AuthentificationService} from '../services/authentification.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css', '../app.component.css']
})
export class MenuComponent {

  constructor(private authService: AuthentificationService) {

  }

  isAdmin() {
    return this.authService.isAdmin();
  }

  logOut() {
    this.authService.logout();
  }
}
