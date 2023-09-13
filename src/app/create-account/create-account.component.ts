import {Component} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {IUtilisateur} from "../interfaces/IUtilisateur";

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

  // @ts-ignore
  selectedUser: IUtilisateur;
  newPassword: string = '';
  utilisateurs: IUtilisateur[] = [];

  constructor(private http: HttpClient) {
    this.http.get<IUtilisateur[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/users').subscribe({
      next: data => {
        data.forEach(user => this.utilisateurs.push(user));
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des utilisateurs');
      }
    })
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

    this.selectedUser.password = this.newPassword;

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/updatePassword', this.selectedUser).subscribe({
      next: response => {
        alert('Mot de passe modifié');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la modification');
      }
    });

    // Réinitialisation du formulaire après soumission
    this.user = {
      pseudo: '',
      password: ''
    };

    // Réinitialisation du formulaire après soumission
    this.newPassword = '';
  }
}
