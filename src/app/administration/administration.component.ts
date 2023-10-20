import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css', '../app.component.css']
})
export class AdministrationComponent {

  constructor(private router: Router) {}

  goToCreateAccount() {
    this.router.navigate(['/create-account']);
  }

  goToDeckAttribution() {
    this.router.navigate(['/attribution-deck']);
  }

  goToDataManagement() {
    this.router.navigate(['/card-management']);
  }

  goToPartiesManagement() {
    this.router.navigate(['/parties-management']);
  }
}
