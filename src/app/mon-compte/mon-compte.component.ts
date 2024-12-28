import { Component } from '@angular/core';
import {Utilisateur} from "../classes/Utilisateur";
import { HttpClient } from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";
import {Router} from "@angular/router";

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

  utilisateur: Utilisateur;
  newPassword: string = '';
  codePromo: string = '';

  constructor(private http: HttpClient, private authService: AuthentificationService, private router: Router) {
    // @ts-ignore
    this.utilisateur = this.authService.getUser();
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

  onEnterCode() {
    if (this.codePromo !== null && this.codePromo !== '') {
      const codePromoBody = {
        codePromo: this.codePromo,
        utilisateur: this.utilisateur
      }
      // codePromo
      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/useCodePromo', codePromoBody).subscribe({
        next: response => {
          alert('Code promo validé');
        },
        error: error => {
          console.error('There was an error!', error);
          alert('Code promo invalide');
        }
      });
    } else {
      alert('Aucun code promo entré');
    }
  }

  goToAvatarBuilder() {
    this.router.navigate(['/avatar-builder']);
  }
}
