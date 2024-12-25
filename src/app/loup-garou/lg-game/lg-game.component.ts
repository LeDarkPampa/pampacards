import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SseService } from '../../services/sse.service';
import {LgGameState, Player} from './LgGameState';
import { Subscription } from 'rxjs';
import {LgGameService} from "./lg-game.service";

@Component({
  selector: 'app-lg-game',
  templateUrl: './lg-game.component.html',
  styleUrls: ['./lg-game.component.css', '../../app.component.css'],
})
export class LgGameComponent implements OnInit, OnDestroy {
  private gameStateSubscription!: Subscription;

  isStreamerMode = false;
  isHovering: boolean = false;
  partieId: number = 0;
  playerId: string = '';

  confirmationMessage = '';
  generatedCode = '';

  gameState: LgGameState = {
    gameId: 0,
    state: '',
    phase: {
      name: '',
      description: '',
      remainingTime: 0,
    },
    players: [],
    actions: [],
    votes: [],
    results: {
      winner: null,
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
        potionLife: false,
      },
    },
    timestamp: '',
  };

  constructor(
    private route: ActivatedRoute,
    private sseService: SseService,
    private lgGameService: LgGameService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.partieId = params['gameId'];
      this.playerId = params['playerId'];
    });

    this.lgGameService.getPartieCode(this.partieId).subscribe(code => {
      this.generatedCode = code;
    });

    this.subscribeToGameStateFlux();
  }

  /**
   * Copie le code généré dans le presse-papiers et affiche un message de confirmation
   */
  copyGameCode(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.generatedCode;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      this.confirmationMessage = successful
        ? 'Code copié dans le presse-papiers!'
        : 'Échec de la copie du code.';
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      this.confirmationMessage = 'Erreur lors de la copie.';
    } finally {
      document.body.removeChild(textArea);
    }

    setTimeout(() => (this.confirmationMessage = ''), 3000);
  }

  /**
   * Bascule le mode streamer
   */
  toggleStreamerMode(): void {
    this.isStreamerMode = !this.isStreamerMode;
  }

  /**
   * Abonne le composant au flux de l'état du jeu
   */
  private subscribeToGameStateFlux() {
    this.sseService.getGameStateFlux(this.partieId);
    this.gameStateSubscription = this.sseService.gameStates$.subscribe(
      (gameState: LgGameState) => {
        this.gameState = gameState;
        this.cd.detectChanges();
      },
      (error: any) => console.error('Error receiving game state:', error)
    );
  }

  currentPlayer(): Player | undefined {
    return this.gameState.players.find(player => player.id === this.playerId);
  }

  ngOnDestroy() {
    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }
    this.sseService.closeGameStateEventSource();
  }
}
