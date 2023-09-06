import {Component, OnInit} from '@angular/core';
import {IType} from "../interfaces/IType";
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent implements OnInit {

  constructor(private http: HttpClient, private authService: AuthentificationService) {

  }

  ngOnInit() {
  }

  isLoggedIn(): boolean {
    return this.authService.isLogged();
  }

}

