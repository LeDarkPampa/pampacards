import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css']
})
export class AdministrationComponent {

  constructor(private router: Router) {}

  goToCreateAccount() {
    // Rediriger vers l'écran de création de compte
    this.router.navigate(['/create-account']);
  }

  goToDeckAttribution() {
    this.router.navigate(['/attribution-deck']);
  }

  goToDataManagement() {
    this.router.navigate(['/card-management']);
  }

  goToPartiesManagement() {
    // Rediriger vers l'écran d'administration des données
    this.router.navigate(['/parties-management']);
  }
}
