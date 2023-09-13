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
  selectedUserName: string = '';
  newPassword: string = '';
  utilisateurs: IUtilisateur[] = [];
  pseudosUtilisateurs: string[] = [];

  constructor(private http: HttpClient) {
    this.http.get<IUtilisateur[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/users').subscribe({
      next: data => {
        data.forEach(user => {
          this.utilisateurs.push(user);
          this.pseudosUtilisateurs.push(user.pseudo);
        });
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
    const selectedUserObject = this.utilisateurs.find(user => user.pseudo === this.selectedUserName);

    if (selectedUserObject) {
      this.selectedUser = selectedUserObject;

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
      this.newPassword = '';
    } else {
      // Gérer le cas où l'utilisateur sélectionné n'est pas trouvé (s'il y a une erreur)
      console.error('Utilisateur non trouvé');
    }
  }
}
