import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {IPlayerState} from "../../interfaces/IPlayerState";
import {IPartie} from "../../interfaces/IPartie";
import {Subject, Subscription} from "rxjs";
import {IEvenementPartie} from "../../interfaces/IEvenementPartie";
import {ICarte} from "../../interfaces/ICarte";
import {IChatPartieMessage} from "../../interfaces/IChatPartieMessage";
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {AuthentificationService} from "../../services/authentification.service";
import {DialogService} from "primeng/dynamicdialog";
import {SseService} from "../../services/sse.service";
import {EffetEnum} from "../../interfaces/EffetEnum";
import {VisionCartesDialogComponent} from "../vision-cartes-dialog/vision-cartes-dialog.component";

@Component({
  selector: 'app-partie-obs',
  templateUrl: './partie-obs.component.html',
  styleUrls: ['./partie-obs.component.css', '../../app.component.css']
})
export class PartieObsComponent  implements OnInit, OnDestroy {
  // @ts-ignore
  joueur: IPlayerState;
  // @ts-ignore
  adversaire: IPlayerState;
  // @ts-ignore
  partie: IPartie;
  // @ts-ignore
  partieId: number;
  // @ts-ignore
  type: string;
  finDePartie = false;
  // @ts-ignore
  private evenementsPartieSubscription: Subscription;
  // @ts-ignore
  lastEvent: IEvenementPartie;
  // @ts-ignore
  private firstEvent: IEvenementPartie;
  // @ts-ignore
  actuaLEvent: IEvenementPartie;
  listEvents: IEvenementPartie[] = [];
  lastEventId: number = 0;
  carteSelectionneeSubject = new Subject<ICarte>();
  vainqueur = "";
  chatMessages: IChatPartieMessage[] = [];
  message: string = '';
  clickedCartePath: string = '';
  tourAffiche = 0;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone,
              private sseService: SseService, private cd: ChangeDetectorRef) {

  }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.partieId = params['id'];
      this.type = params['type'];
      this.getPartie();
      this.cd.detectChanges();
    });
  }

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {
    this.tourAffiche = Math.ceil(lastEvent.tour / 2);

    this.joueur.id = this.partie.joueurUn.id;
    this.adversaire.id = this.partie.joueurDeux.id;

    this.joueur.deck = lastEvent.cartesDeckJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesDeckJoueurUn) : [];
    this.adversaire.deck = lastEvent.cartesDeckJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesDeckJoueurDeux) : [];

    this.joueur.main = lastEvent.cartesMainJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesMainJoueurUn) : [];
    this.adversaire.main = lastEvent.cartesMainJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesMainJoueurDeux) : [];

    this.joueur.terrain = lastEvent.cartesTerrainJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesTerrainJoueurUn) : [];
    this.adversaire.terrain = lastEvent.cartesTerrainJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesTerrainJoueurDeux) : [];

    this.joueur.defausse = lastEvent.cartesDefausseJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesDefausseJoueurUn) : [];
    this.adversaire.defausse = lastEvent.cartesDefausseJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesDefausseJoueurDeux) : [];

    if (lastEvent.status == "DEBUT_PARTIE") {
      this.initCards();
    }
    this.updateEffetsContinusAndScores();

    this.cd.detectChanges();
  }

  private initValues() {
    let nomJoueur = '';
    let nomAdversaire = '';
    let idJoueur = 0;
    let idAdversaire = 0;
    nomJoueur = this.partie.joueurUn.pseudo;
    idJoueur = this.partie.joueurUn.id;
    nomAdversaire = this.partie.joueurDeux.pseudo;
    idAdversaire = this.partie.joueurDeux.id;
    this.joueur = {
      id: idJoueur,
      nom: nomJoueur,
      main: [],
      terrain: [],
      deck: [],
      defausse: [],
      score: 0
    };

    this.adversaire = {
      id: idAdversaire,
      nom: nomAdversaire,
      main: [],
      terrain: [],
      deck: [],
      defausse: [],
      score: 0
    };
  }

  private initCards() {
    this.joueur.deck.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.corrompu = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
    this.joueur.main.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.corrompu = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
    this.adversaire.deck.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.corrompu = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
    this.adversaire.main.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.corrompu = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
  }

  private memeTypeOuClan(c: ICarte, carte: ICarte) {
    return (c.clan.id == carte.clan.id || c.type.id == carte.type.id) && !c.corrompu;
  }

  private getPuissanceTotale(carte: ICarte) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

  showVisionCartesDialog(cartes: ICarte[]): void {
    const ref = this.dialogService.open(VisionCartesDialogComponent, {
      header: '',
      width: '50%',
      data: { cartes },
      closable: false
    });

    ref.onClose.subscribe(() => {
    });
  }

  private updateEffetsContinusAndScores() {
    // On remet à 0 les puissances continues avant de les recalculer
    let joueurHasProtecteurForet = this.joueur.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;
    let adversaireHasProtecteurForet = this.adversaire.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;

    for (let carte of this.joueur.terrain) {
      carte.diffPuissanceContinue = 0;

      if (joueurHasProtecteurForet) {
        if ((1 == carte.clan.id || 8 == carte.type.id) && !carte.corrompu) {
          carte.bouclier = true;
        }
      }
    }
    for (let carte of this.adversaire.terrain) {
      carte.diffPuissanceContinue = 0;

      if (adversaireHasProtecteurForet) {
        if ((1 == carte.clan.id || 8 == carte.type.id) && !carte.corrompu) {
          carte.bouclier = true;
        }
      }
    }

    let indexCarte = 0;
    for (let carte of this.joueur.terrain) {
      if (carte.effet && carte.effet.continu && !carte.silence) {
        switch(carte.effet.code) {
          case EffetEnum.VAMPIRISME: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.adversaire.defausse.length;
            break;
          }
          case EffetEnum.CANNIBALE: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.joueur.defausse.length;
            break;
          }
          case EffetEnum.ESPRIT_EQUIPE: {
            let indexCarteCible = 0;
            for (let carteCible of this.joueur.terrain) {
              if (indexCarte != indexCarteCible && this.memeTypeOuClan(carteCible, carte)) {
                carte.diffPuissanceContinue++;
              }
              indexCarteCible++;
            }
            break;
          }
          case EffetEnum.CAPITAINE: {
            let indexCarteCible = 0;
            for (let carteCible of this.joueur.terrain) {
              if (indexCarte != indexCarteCible && !carteCible.insensible && this.memeTypeOuClan(carteCible, carte)) {
                carteCible.diffPuissanceContinue++;
              }
              indexCarteCible++;
            }
            break;
          }
          case EffetEnum.SYMBIOSE: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.joueur.deck.length;
            break;
          }
          case EffetEnum.SANG_PUR: {
            let allCompatible = true;
            for (let carteCible of this.joueur.terrain) {
              if (!this.memeTypeOuClan(carteCible, carte)) {
                allCompatible = false;
              }
            }

            if (allCompatible) {
              carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
            }

            break;
          }
          case EffetEnum.TSUNAMI: {
            for (let carteCible of this.adversaire.terrain) {
              if (!carteCible.bouclier) {
                carteCible.diffPuissanceContinue--;
              }
            }
            break;
          }
          case EffetEnum.DOMINATION: {
            for (let carteCible of this.adversaire.terrain) {
              if (!carteCible.bouclier && carteCible.corrompu) {
                carteCible.diffPuissanceContinue--;
              }
            }
            break;
          }
          case EffetEnum.RESISTANCE: {
            if (this.joueur.defausse.length < 3) {
              carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
            }
            break;
          }
          case EffetEnum.ILLUMINATI: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.adversaire.terrain.length;
            break;
          }
          default: {
            //statements;
            break;
          }
        }
      }
      indexCarte++;
    }

    indexCarte = 0;
    for (let carte of this.adversaire.terrain) {
      if (carte.effet && carte.effet.continu && !carte.silence) {
        switch(carte.effet.code) {
          case EffetEnum.VAMPIRISME: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.joueur.defausse.length;
            break;
          }
          case EffetEnum.CANNIBALE: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.adversaire.defausse.length;
            break;
          }
          case EffetEnum.ESPRIT_EQUIPE: {
            let indexCarteCible = 0;
            for (let carteCible of this.adversaire.terrain) {
              if (indexCarte != indexCarteCible && this.memeTypeOuClan(carteCible, carte)) {
                carte.diffPuissanceContinue++;
              }
              indexCarteCible++;
            }
            break;
          }
          case EffetEnum.CAPITAINE: {
            let indexCarteCible = 0;
            for (let carteCible of this.adversaire.terrain) {
              if (indexCarte != indexCarteCible && this.memeTypeOuClan(carteCible, carte) && !carteCible.insensible) {
                carteCible.diffPuissanceContinue++;
              }
              indexCarteCible++;
            }
            break;
          }
          case EffetEnum.SYMBIOSE: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.adversaire.deck.length;
            break;
          }
          case EffetEnum.SANG_PUR: {
            let allCompatible = true;
            for (let carteCible of this.adversaire.terrain) {
              if (!this.memeTypeOuClan(carteCible, carte)) {
                allCompatible = false;
              }
            }

            if (allCompatible) {
              carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
            }

            break;
          }
          case EffetEnum.TSUNAMI: {
            for (let carteCible of this.joueur.terrain) {
              if (!carteCible.bouclier) {
                carteCible.diffPuissanceContinue--;
              }
            }
            break;
          }
          case EffetEnum.DOMINATION: {
            for (let carteCible of this.joueur.terrain) {
              if (!carteCible.bouclier && carteCible.corrompu) {
                carteCible.diffPuissanceContinue--;
              }
            }
            break;
          }
          case EffetEnum.RESISTANCE: {
            if (this.adversaire.defausse.length < 3) {
              carte.diffPuissanceContinue += carte.effet.valeurBonusMalus;
            }
            break;
          }
          case EffetEnum.ILLUMINATI: {
            carte.diffPuissanceContinue += carte.effet.valeurBonusMalus * this.joueur.terrain.length;
            break;
          }
          default: {
            //statements;
            break;
          }
        }
      }
      indexCarte++;
    }

    this.updateScores();
  }

  private updateScores() {
    let sommePuissancesJoueur = 0;
    let sommePuissancesAdversaire = 0;

    for (let carte of this.joueur.terrain) {
      sommePuissancesJoueur += this.getPuissanceTotale(carte);
    }

    for (let carte of this.adversaire.terrain) {
      sommePuissancesAdversaire += this.getPuissanceTotale(carte);
    }

    this.joueur.score = sommePuissancesJoueur;
    this.adversaire.score = sommePuissancesAdversaire;
  }

  voirDefausse(defausse: ICarte[]) {
    this.showVisionCartesDialog(defausse);
  }

  private getPartie() {
    this.http.get<IPartie>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partie?partieId=' + this.partieId).subscribe({
      next: partie => {
        this.partie = partie;
        this.initValues();
        this.getEventsPartie();

        if (this.type === 'obs') {
          this.getChatPartieMessages();
          this.subscribeToEvenementsPartieFlux();
          this.subscribeToChatMessagesFlux();
        }
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private subscribeToEvenementsPartieFlux() {
    this.sseService.getEvenementsPartieFlux(this.partieId);
    this.evenementsPartieSubscription = this.sseService.evenementsPartie$.subscribe(
      (evenementsPartie: IEvenementPartie[]) => {
        // @ts-ignore
        this.lastEvent = evenementsPartie.at(-1);
        if (this.lastEvent && this.lastEvent.id > this.lastEventId) {
          this.lastEventId = this.lastEvent.id;
          this.updateGameFromLastEvent(this.lastEvent);
        }
      },
      (error: any) => console.error(error)
    );
  }

  private getEventsPartie() {
    this.http.get<IEvenementPartie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvents?partieId=' + this.partieId).subscribe({
      next: evenementsPartie => {

        if (this.type === 'obs') {
          // @ts-ignore
          this.lastEvent = evenementsPartie.at(-1);
          if (this.lastEvent && this.lastEvent.id > this.lastEventId) {
            this.lastEventId = this.lastEvent.id;
            this.updateGameFromLastEvent(this.lastEvent);
          }
        } else if (this.type === 'replay') {
          this.listEvents = evenementsPartie;
          // @ts-ignore
          this.firstEvent = evenementsPartie.at(0);
          this.actuaLEvent = this.firstEvent;
          this.updateGameFromLastEvent(this.actuaLEvent);
        }
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private subscribeToChatMessagesFlux() {
    this.sseService.getChatMessagesFlux(this.partieId);
    this.evenementsPartieSubscription = this.sseService.chatMessages$.subscribe(
      (chatPartieMessages: IChatPartieMessage[]) => {
        // @ts-ignore
        this.chatMessages = chatPartieMessages;
        this.cd.detectChanges();
      },
      (error: any) => console.error(error)
    );
  }

  private getChatPartieMessages() {
    this.http.get<IChatPartieMessage[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/chatMessages?partieId=' + this.partieId).subscribe({
      next: chatMessages => {
        // @ts-ignore
        this.chatMessages = chatMessages;
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  ngOnDestroy() {
    if (this.evenementsPartieSubscription) {
      this.evenementsPartieSubscription.unsubscribe();
    }

    this.sseService.closeEvenementsPartieEventSource();
    this.sseService.closeEvenementsChatEventSource();
  }

  precedent() {
    const currentIndex = this.listEvents.findIndex(event => event === this.actuaLEvent);
    if (currentIndex > 0) {
      this.actuaLEvent = this.listEvents[currentIndex - 1];
      this.updateGameFromLastEvent(this.actuaLEvent);
    } else {
      console.log("Il n'y a pas d'événement précédent.");
    }
  }

  suivant() {
    const currentIndex = this.listEvents.findIndex(event => event === this.actuaLEvent);
    if (currentIndex < this.listEvents.length - 1) {
      this.actuaLEvent = this.listEvents[currentIndex + 1];
      this.updateGameFromLastEvent(this.actuaLEvent);
    } else {
      console.log("Il n'y a pas d'événement suivant.");
    }
  }

  premier () {
    this.actuaLEvent = this.listEvents[0];
    this.updateGameFromLastEvent(this.actuaLEvent);
  }

  dernier () {
    this.actuaLEvent = this.listEvents[this.listEvents.length-1];
    this.updateGameFromLastEvent(this.actuaLEvent);
  }
}
