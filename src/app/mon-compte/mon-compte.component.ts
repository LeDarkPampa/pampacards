import { Component } from '@angular/core';
import { Utilisateur } from '../classes/Utilisateur';
import { AuthentificationService } from '../services/authentification.service';
import { Router } from '@angular/router';
import { UtilisateurService } from '../services/utilisateur.service';
import { UiMessageService } from '../services/ui-message.service';
import { MON_COMPTE_MSG } from '../core/messages/domain.messages';

@Component({
  selector: 'app-mon-compte',
  templateUrl: './mon-compte.component.html',
  styleUrls: ['./mon-compte.component.css', '../app.component.css'],
})
export class MonCompteComponent {
  user = {
    pseudo: '',
    password: '',
  };

  utilisateur: Utilisateur;
  newPassword: string = '';
  codePromo: string = '';

  passwordSubmitting = false;
  promoSubmitting = false;

  constructor(
    private authService: AuthentificationService,
    private router: Router,
    private utilisateurService: UtilisateurService,
    private uiMessage: UiMessageService
  ) {
    this.utilisateur = this.authService.getUser();
  }

  onChangePassword() {
    if (!this.utilisateur) {
      return;
    }
    this.passwordSubmitting = true;
    this.utilisateur.password = this.newPassword;

    this.utilisateurService.updatePassword(this.utilisateur).subscribe({
      next: () => {
        this.uiMessage.success(MON_COMPTE_MSG.PASSWORD_OK);
        this.newPassword = '';
        this.passwordSubmitting = false;
      },
      error: () => {
        this.uiMessage.error(MON_COMPTE_MSG.PASSWORD_ERR);
        this.passwordSubmitting = false;
      },
    });
  }

  onEnterCode() {
    if (!this.codePromo?.trim()) {
      this.uiMessage.warn(MON_COMPTE_MSG.PROMO_EMPTY);
      return;
    }
    this.promoSubmitting = true;
    const codePromoBody = {
      codePromo: this.codePromo,
      utilisateur: this.utilisateur,
    };
    this.utilisateurService.useCodePromo(codePromoBody).subscribe({
      next: () => {
        this.uiMessage.success(MON_COMPTE_MSG.PROMO_OK);
        this.codePromo = '';
        this.promoSubmitting = false;
      },
      error: () => {
        this.uiMessage.error(MON_COMPTE_MSG.PROMO_ERR);
        this.promoSubmitting = false;
      },
    });
  }

  goToAvatarBuilder() {
    this.router.navigate(['/avatar-builder']);
  }

  goToDefisList() {
    this.router.navigate(['/defis-list']);
  }
}
