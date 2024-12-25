import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-lg-game',
  templateUrl: './lg-game.component.html',
  styleUrls: ['./lg-game.component.css', '../../app.component.css']
})
export class LgGameComponent implements OnInit {

  partieId: number = 0;
  playerId: string = '';
  confirmationMessage: string = '';
  generatedCode: string = '';

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.partieId = params['gameId'];
      this.playerId = params['playerId'];
    });
  }

  copyGameCode(): void {
    this.generatedCode = 'azerty';

    // Fallback basé sur l'ancienne méthode execCommand
    const textArea = document.createElement('textarea');
    textArea.value = this.generatedCode;

    // Styles pour que le textarea soit invisible à l'utilisateur
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px'; // Place le textarea hors de l'écran
    document.body.appendChild(textArea);

    textArea.select(); // Sélectionner le texte

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.confirmationMessage = 'Code copié dans le presse-papiers!';
      } else {
        this.confirmationMessage = 'Échec de la copie du code.';
      }
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      this.confirmationMessage = 'Erreur lors de la copie.';
    } finally {
      document.body.removeChild(textArea); // Supprimer le textarea temporaire
    }

    // Réinitialiser le message après quelques secondes
    setTimeout(() => this.confirmationMessage = '', 3000);
  }

}
