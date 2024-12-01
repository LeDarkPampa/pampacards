import { Component } from '@angular/core';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Utilisateur } from "../../classes/Utilisateur";

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css', '../../app.component.css']
})
export class CreateAccountComponent {
  user = {
    pseudo: '',
    password: ''
  };

  selectedUserName: string = '';
  selectedUserNameReinit: string = '';
  newPassword: string = '';
  utilisateurs: Utilisateur[] = [];
  pseudosUtilisateurs: string[] = [];

  constructor(private utilisateurService: UtilisateurService) {
    this.utilisateurService.getUtilisateurs().subscribe({
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
    this.utilisateurService.createUser(this.user).subscribe({
      next: response => {
        alert('Utilisateur créé');
        this.resetForm();
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la création');
      }
    });
  }

  onChangePassword() {
    const selectedUser = this.utilisateurs.find(user => user.pseudo === this.selectedUserName);

    if (selectedUser) {
      selectedUser.password = this.newPassword;
      this.utilisateurService.updatePassword(selectedUser).subscribe({
        next: response => {
          alert('Mot de passe modifié');
          this.newPassword = '';
        },
        error: error => {
          console.error('There was an error!', error);
          alert('Erreur lors de la modification');
        }
      });
    } else {
      console.error('Utilisateur non trouvé');
    }
  }

  onReinitUser() {
    if (this.selectedUserNameReinit) {
      this.utilisateurService.reinitUser(this.selectedUserNameReinit).subscribe({
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

  private resetForm() {
    this.user = {
      pseudo: '',
      password: ''
    };
  }
}
