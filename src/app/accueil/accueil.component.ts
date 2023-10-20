import {Component} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss', '../app.component.css']
})
export class AccueilComponent {

  constructor(private http: HttpClient, private authService: AuthentificationService) {

  }

  isLoggedIn(): boolean {
    return this.authService.isLogged();
  }

}

