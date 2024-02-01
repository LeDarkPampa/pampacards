import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {AuthentificationService} from "../services/authentification.service";
import {first} from "rxjs";

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss', '../app.component.css']
})
export class AccueilComponent {

  constructor(public authService: AuthentificationService, private router: Router) {}

  navigateTo(link: string) {

  }

  async isLoggedIn(): Promise<boolean> {
    const isLoggedIn = await this.authService.isLoggedIn$.pipe(first()).toPromise();
    return !!isLoggedIn; // Convertir la valeur en un boolean avec l'opérateur double négation (!!).
  }
}
