import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss', '../app.component.css']
})
export class AccueilComponent {

  constructor(private router: Router) {}

  navigateTo(link: string) {

  }
}
