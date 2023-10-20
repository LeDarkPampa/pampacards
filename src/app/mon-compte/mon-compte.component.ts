import { Component } from '@angular/core';
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";

@Component({
  selector: 'app-mon-compte',
  templateUrl: './mon-compte.component.html',
  styleUrls: ['./mon-compte.component.css', '../app.component.css']
})
export class MonCompteComponent {
  user = {
    pseudo: '',
    password: ''
  };

  utilisateur: IUtilisateur;
  newPassword: string = '';

  constructor(private http: HttpClient, private authService: AuthentificationService) {
    this.utilisateur = this.authService.user;
  }

  onChangePassword() {
    if (this.utilisateur) {
      this.utilisateur.password = this.newPassword;

      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/updatePassword', this.utilisateur).subscribe({
        next: response => {
          alert('Mot de passe modifié');
        },
        error: error => {
          console.error('There was an error!', error);
          alert('Erreur lors de la modification');
        }
      });

      // Réinitialisation du formulaire après soumission
      this.newPassword = '';
    } else {
      console.error('Utilisateur non trouvé');
    }
  }
}
