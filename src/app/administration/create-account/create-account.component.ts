import { Component } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { IUtilisateur } from "../../interfaces/IUtilisateur";

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

  selectedUserName: string = '';
  selectedUserNameReinit: string = '';
  newPassword: string = '';
  utilisateurs: IUtilisateur[] = [];
  pseudosUtilisateurs: string[] = [];

  constructor(private http: HttpClient) {
    this.http.get<IUtilisateur[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/users').subscribe({
      next: data => {
        this.utilisateurs = data;
        this.pseudosUtilisateurs = data.map(user => user.pseudo);
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des utilisateurs');
      }
    });
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

  onChangePassword() {
    const selectedUserPseudo = this.selectedUserName;

    const selectedUserObject = this.utilisateurs.find(user => user.pseudo === selectedUserPseudo);

    if (selectedUserObject) {
      selectedUserObject.password = this.newPassword;

      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/updatePassword', selectedUserObject).subscribe({
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

  onReinitUser() {
    const selectedUserPseudo = this.selectedUserNameReinit;

    if (selectedUserPseudo) {
      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/reinituser', selectedUserPseudo).subscribe({
        next: response => {
          alert('Utilisateur réinitialisé');
        },
        error: error => {
          console.error('There was an error!', error);
          alert('Erreur lors de la réinitialisation');
        }
      });

    } else {
      console.error('Utilisateur non trouvé');
    }
  }
}
