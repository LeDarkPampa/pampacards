import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";
import {SseService} from "../services/sse.service";
import {DialogService} from "primeng/dynamicdialog";
import {DeckService} from "../services/deck.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent {
  user = {
    pseudo: '',
    password: ''
  };

  constructor(private http: HttpClient) {

  }

  onSubmit() {
    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/user', this.user).subscribe({
      next: response => {
        alert('Utilisateur créé');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la création');
      }
    });

    // Réinitialisation du formulaire après soumission
    this.user = {
      pseudo: '',
      password: ''
    };
  }
}
