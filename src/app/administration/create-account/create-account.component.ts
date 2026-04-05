import { Component } from '@angular/core';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Utilisateur } from '../../classes/Utilisateur';
import { UiMessageService } from '../../services/ui-message.service';
import { ADMIN_MSG, MON_COMPTE_MSG } from '../../core/messages/domain.messages';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css', '../../app.component.css'],
})
export class CreateAccountComponent {
  user = {
    pseudo: '',
    password: '',
  };

  selectedUserName: string = '';
  selectedUserNameReinit: string = '';
  newPassword: string = '';
  utilisateurs: Utilisateur[] = [];
  pseudosUtilisateurs: string[] = [];

  createBusy = false;
  passwordBusy = false;
  reinitBusy = false;

  constructor(private utilisateurService: UtilisateurService, private uiMessage: UiMessageService) {
    this.utilisateurService.getUtilisateurs().subscribe({
      next: (data) => {
        this.utilisateurs = data;
        this.pseudosUtilisateurs = data.map((user) => user.pseudo);
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.USERS_ERR);
      },
    });
  }

  onSubmit() {
    this.createBusy = true;
    this.utilisateurService.createUser(this.user).subscribe({
      next: () => {
        this.uiMessage.success(ADMIN_MSG.USER_CREATED);
        this.resetForm();
        this.createBusy = false;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.USER_CREATE_ERR);
        this.createBusy = false;
      },
    });
  }

  onChangePassword() {
    const selectedUser = this.utilisateurs.find((user) => user.pseudo === this.selectedUserName);

    if (!selectedUser) {
      return;
    }
    this.passwordBusy = true;
    selectedUser.password = this.newPassword;
    this.utilisateurService.updatePassword(selectedUser).subscribe({
      next: () => {
        this.uiMessage.success(MON_COMPTE_MSG.PASSWORD_OK);
        this.newPassword = '';
        this.passwordBusy = false;
      },
      error: () => {
        this.uiMessage.error(MON_COMPTE_MSG.PASSWORD_ERR);
        this.passwordBusy = false;
      },
    });
  }

  onReinitUser() {
    if (!this.selectedUserNameReinit) {
      return;
    }
    this.reinitBusy = true;
    this.utilisateurService.reinitUser(this.selectedUserNameReinit).subscribe({
      next: () => {
        this.uiMessage.success(ADMIN_MSG.USER_REINIT);
        this.reinitBusy = false;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.USER_REINIT_ERR);
        this.reinitBusy = false;
      },
    });
  }

  private resetForm() {
    this.user = {
      pseudo: '',
      password: '',
    };
  }
}
