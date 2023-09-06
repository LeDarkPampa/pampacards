import { Component } from '@angular/core';
import {AuthentificationService} from '../services/authentification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {

  constructor(private authService: AuthentificationService) {

  }

  logOut() {
    this.authService.logout();
  }
}
