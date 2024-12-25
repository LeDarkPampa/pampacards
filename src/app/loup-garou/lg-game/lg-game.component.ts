import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../../services/sse.service";
import {LgGameState} from "../../classes/parties/LgGameState";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-lg-game',
  templateUrl: './lg-game.component.html',
  styleUrls: ['./lg-game.component.css', '../../app.component.css']
})
export class LgGameComponent implements OnInit, OnDestroy {

  // @ts-ignore
  private gameStateSubscription: Subscription;

  isStreamerMode: boolean = false;
  partieId: number = 0;
  playerId: string = '';
  confirmationMessage: string = '';
  generatedCode: string   = '';

  gameState: LgGameState = {
    gameId: 0,
    state: '',
    phase: {
      name: '',
      description: '',
      remainingTime: 0
    },
    players: [],
    actions: [],
    votes: [],
    results: {
      eliminatedPlayer: null,
      killedPlayer: null,
      winner: null
    },
    roleStates: {
      lastProtectedPlayerId: null,
      influencerUsedPower: false,
      platformUsedPower: false,
      haterTriggered: false,
      gamerVotedOutFirstRound: false,
      loverLinks: {},
      minorMentorId: null,
      botCheckedPlayerId: null,
      timeoutVotes: {},
      usedPotions: {
        potionDeath: false,
        potionLife: false
      }
    },
    timestamp: ''
  };


  constructor(private route: ActivatedRoute, private sseService: SseService, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.partieId = params['gameId'];
      this.playerId = params['playerId'];
    });

    this.subscribeToGameStateFlux();
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

  toggleStreamerMode(): void {
    this.isStreamerMode = !this.isStreamerMode;
  }

  private subscribeToGameStateFlux() {
    this.sseService.getGameStateFlux(this.partieId);
    this.gameStateSubscription = this.sseService.gameStates$.subscribe(
      (gameState: LgGameState) => {
        // @ts-ignore
        this.gameState = gameState;
        this.cd.detectChanges();
      },
      (error: any) => console.error(error)
    );
  }

  ngOnDestroy() {
    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }

    this.sseService.closeGameStateEventSource();
  }
}
