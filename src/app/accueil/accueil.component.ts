import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthentificationService } from '../services/authentification.service';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss', '../app.component.css'],
})
export class AccueilComponent {
  constructor(public authService: AuthentificationService, private router: Router) {}

  navigateTo(link: string): void {
    this.router.navigate([link]);
  }
}
