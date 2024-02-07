import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../services/sse.service";
import {Subject, Subscription} from "rxjs";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {HttpClient} from "@angular/common/http";
import {IPartie} from "../interfaces/IPartie";
import {IPlayerState} from "../interfaces/IPlayerState";
import {AuthentificationService} from "../services/authentification.service";
import {EffetEnum} from "../interfaces/EffetEnum";
import {ICarte} from "../interfaces/ICarte";
import {DialogService} from "primeng/dynamicdialog";
import {SelectionCarteDialogComponent} from "./selection-carte-dialog/selection-carte-dialog.component";
import {VisionCartesDialogComponent} from "./vision-cartes-dialog/vision-cartes-dialog.component";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";
import {IChatPartieMessage} from "../interfaces/IChatPartieMessage";
import {IClan} from "../interfaces/IClan";
import {IType} from "../interfaces/IType";

@Component({
  selector: 'app-partie',
  templateUrl: './partie.component.html',
  styleUrls: ['./partie.component.css', '../app.component.css']
})
export class PartieComponent implements OnInit, OnDestroy {

  userId = 0;
  // @ts-ignore
  joueur: IPlayerState;
  // @ts-ignore
  adversaire: IPlayerState;
  // @ts-ignore
  partie: IPartie;
  // @ts-ignore
  partieId: number;
  finDePartie = false;
  // @ts-ignore
  private evenementsPartieSubscription: Subscription;
  // @ts-ignore
  lastEvent: IEvenementPartie;
  lastEventId: number = 0;
  estJoueurActif = false;
  estPremierJoueur: boolean = false;
  carteSelectionneeSubject = new Subject<ICarte>();
  public carteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  public secondeCarteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  vainqueur = "";
  carteJouee = false;
  carteDefaussee = false;
  clickedCartePath: string = '';
  isFlashing: boolean = false;
  enAttente: boolean = true;
  joueurAbandon: string = '';
  nomCorrompu = 'Corrompu';
  clanCorrompu: IClan = {
    id: 0,
    nom: this.nomCorrompu
  };

  typeCorrompu: IType = {
    id: 0,
    nom: this.nomCorrompu
  };

  poissonPourri: ICarte = {
    id: 0,
    nom: 'Poisson pourri',
    clan: {
      id: -1,
      nom: 'Mafia'
    },
    type: {
      id: -1,
      nom: 'Eau'
    },
    rarete: 0,
    effet: null,
    puissance: -1,
    image_path: 'poissonpourri.png',
    silence: false,
    bouclier: false,
    insensible: false,
    prison: false,
    diffPuissanceInstant: 0,
    diffPuissanceContinue: 0,
    released: false
  }

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone,
              private sseService: SseService, private cd: ChangeDetectorRef) {
    this.userId = authService.getUserId();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.partieId = params['id'];
      this.getPartie();
      this.getEventsPartie();
      this.subscribeToEvenementsPartieFlux();
      this.cd.detectChanges();
    });
  }

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {
    if (!(this.lastEvent.status == "EN_ATTENTE")) {
      this.enAttente = false;
      if (this.lastEvent.status == "FIN_PARTIE" && !this.finDePartie) {
        this.finDePartie = true;
        if (this.joueur.id == this.partie.joueurUn.id) {
          this.terminerPartie();
        }
      }

      if (this.lastEvent.status == "ABANDON") {
        this.finDePartie = true;

      }

      this.estJoueurActif = lastEvent.joueurActifId == this.userId;

      if (this.lastEvent.joueurActifId != this.joueur.id || this.lastEvent.status != "TOUR_EN_COURS" || (this.joueur.terrain.length == 0 && this.joueur.deck.length == 0)) {
        if (this.partie.joueurUn.id == this.userId) {
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
        } else if (this.partie.joueurDeux.id == this.userId) {
          this.joueur.id = this.partie.joueurDeux.id;
          this.adversaire.id = this.partie.joueurUn.id;

          this.adversaire.deck = lastEvent.cartesDeckJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesDeckJoueurUn) : [];
          this.joueur.deck = lastEvent.cartesDeckJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesDeckJoueurDeux) : [];

          this.adversaire.main = lastEvent.cartesMainJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesMainJoueurUn) : [];
          this.joueur.main = lastEvent.cartesMainJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesMainJoueurDeux) : [];

          this.adversaire.terrain = lastEvent.cartesTerrainJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesTerrainJoueurUn) : [];
          this.joueur.terrain = lastEvent.cartesTerrainJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesTerrainJoueurDeux) : [];

          this.adversaire.defausse = lastEvent.cartesDefausseJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesDefausseJoueurUn) : [];
          this.joueur.defausse = lastEvent.cartesDefausseJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesDefausseJoueurDeux) : [];
        }
      }

      if (this.lastEvent.status == "NOUVEAU_TOUR") {
        if (this.estJoueurActif) {
          this.carteJouee = false;
          this.carteDefaussee = false;

          this.isFlashing = true; // Activez l'animation de flash

          // On pioche jusqu'à avoir 4 cartes en main si on est le joueur actif
          while (this.joueur.main.length < 4 && this.joueur.deck.length > 0) {
            this.piocherCarte();
          }

          // Désactivez l'animation de flash après un certain délai
          setTimeout(() => {
            this.isFlashing = false;
          }, 1000);
        }
      }

      if (lastEvent.status == "DEBUT_PARTIE") {
        this.initCards();
      }
      this.updateEffetsContinusAndScores();

      this.cd.detectChanges();
    } else {
      this.enAttente = true;
      this.cd.detectChanges();
    }
  }

  private initValues() {
    let nomJoueur = '';
    let nomAdversaire = '';
    let idJoueur = 0;
    let idAdversaire = 0;
    if (this.partie.joueurUn.id == this.userId) {
      nomJoueur = this.partie.joueurUn.pseudo;
      idJoueur = this.partie.joueurUn.id;
      nomAdversaire = this.partie.joueurDeux.pseudo;
      idAdversaire = this.partie.joueurDeux.id;
    } else if (this.partie.joueurDeux.id == this.userId) {
      nomJoueur = this.partie.joueurDeux.pseudo;
      idJoueur = this.partie.joueurDeux.id;
      nomAdversaire = this.partie.joueurUn.pseudo;
      idAdversaire = this.partie.joueurUn.id;
    }
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

    this.estPremierJoueur = this.partie.joueurUn.id === this.userId;
  }

  piocherCarte() {
    // Récupération de la première carte du deck
    const cartePiochee = this.joueur.deck.shift();

    // Ajout de la carte piochée à la fin de votre main
    // @ts-ignore
    this.joueur.main.push(cartePiochee);
  }

  onJouerCarte(index: number) {
    let stopJ1 = false;
    let stopJ2 = false;
    if (index !== -1) {
      const carteJouee = this.joueur.main.splice(index, 1)[0];
      this.carteJouee = true;
      this.sendBotMessage(this.joueur.nom + ' joue la carte ' + carteJouee.nom);
      if (carteJouee.effet && !carteJouee.effet.continu) {
        this.playInstantEffect(carteJouee).then(r => {
          if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEUR) {
            this.adversaire.terrain.push(carteJouee);
          } else {
            this.joueur.terrain.push(carteJouee);
          }

          if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.STOP) {
            if (this.joueur.id == this.partie.joueurUn.id) {
              stopJ2 = true;
            } else if (this.joueur.id == this.partie.joueurDeux.id) {
              stopJ1 = true;
            }
          }

          this.updateEffetsContinusAndScores();
          this.sendUpdatedGame(stopJ1, stopJ2);
        });
      } else {
        this.joueur.terrain.push(carteJouee);
        this.updateEffetsContinusAndScores();
        this.sendUpdatedGame();
      }
    }
  }

  jouerNouvelleCarte(carte: ICarte) {
    const index = this.joueur.main.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.main.splice(index, 1)[0];
      if (carte.effet && !carte.effet.continu) {
        this.playInstantEffect(carte).then(r => {
          // @ts-ignore
          if (carte.effet.code == EffetEnum.SABOTEUR) {
            this.adversaire.terrain.push(carte);
          } else {
            this.joueur.terrain.push(carte);
          }
          }
        );
      } else {
        this.joueur.terrain.push(carte);
      }

      let stopJ1 = false;
      let stopJ2 = false;
      if (carte && carte.effet && carte.effet.code == EffetEnum.STOP) {
        if (this.joueur.id == this.partie.joueurUn.id) {
          stopJ2 = true;
        } else if (this.joueur.id == this.partie.joueurDeux.id) {
          stopJ1 = true;
        }
      }

      this.updateEffetsContinusAndScores();
      this.sendUpdatedGame(stopJ1, stopJ2);
      this.updateEffetsContinusAndScores();
    }
  }

  jouerNouvelleCarteDepuisDefausse(carte: ICarte) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }

        this.playInstantEffect(carte).then(r => {
          // @ts-ignore
          if (carte.effet.code == EffetEnum.SABOTEUR) {
            this.adversaire.terrain.push(carte);
          } else {
            this.joueur.terrain.push(carte);
          }
          }
        );
      } else {
        this.joueur.terrain.push(carte);
      }
    }

    this.updateEffetsContinusAndScores();
  }

  recupererCarteEnMainDepuisDefausse(carte: ICarte) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        this.joueur.main.push(carte);
      } else {
        this.joueur.main.push(carte);
      }
    }

    this.updateEffetsContinusAndScores();
  }

  mettreCarteEnDeckEnMainDepuisDefausse(carte: ICarte) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        this.joueur.deck.push(carte);
      } else {
        this.joueur.deck.push(carte);
      }
    }
    this.updateEffetsContinusAndScores();
  }

  onDefausserCarte(index: number) {
    if (index !== -1) {
      const carteJouee = this.joueur.main.splice(index, 1)[0];
      this.sendBotMessage(this.joueur.nom + ' défausse la carte ' + carteJouee.nom);
      this.carteDefaussee = true;
      if (this.isFidelite(carteJouee)) {
        this.sendBotMessage(carteJouee.nom + ' est remise dans le deck');
        this.joueur.deck.push(carteJouee);
        this.melangerDeck(this.joueur.deck);
      } else {
        this.joueur.defausse.push(carteJouee);
      }
    }
    this.updateEffetsContinusAndScores();
    this.sendUpdatedGame();
  }

  private isFidelite(carte: ICarte) {
    return carte.effet && carte.effet.code == EffetEnum.FIDELITE && !carte.silence;
  }

  private isCauchemard(carte: ICarte) {
    return carte.effet && carte.effet.code == EffetEnum.CAUCHEMARD && !carte.silence;
  }

  finDeTour() {
    if (this.estJoueurActif) {
      // @ts-ignore
      let event = this.createEndTurnEvent();

      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
        next: response => {
        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    }
  }

  sendUpdatedGame(stopJ1 = false, stopJ2 = false) {
    // @ts-ignore
    let event = this.createNextEvent(stopJ1, stopJ2);

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
      next: response => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private createEndTurnEvent() {
    return {
      partie: this.partie,
      tour: this.lastEvent.tour,
      joueurActifId: this.lastEvent.joueurActifId,
      premierJoueurId: this.lastEvent.premierJoueurId,
      status: "TOUR_TERMINE",
      cartesMainJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.main) : JSON.stringify(this.adversaire.main),
      cartesMainJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.main) : JSON.stringify(this.adversaire.main),
      cartesTerrainJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.terrain) : JSON.stringify(this.adversaire.terrain),
      cartesTerrainJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.terrain) : JSON.stringify(this.adversaire.terrain),
      cartesDeckJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.deck) : JSON.stringify(this.adversaire.deck),
      cartesDeckJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.deck) : JSON.stringify(this.adversaire.deck),
      cartesDefausseJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      cartesDefausseJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      stopJ1: this.lastEvent.stopJ1,
      stopJ2: this.lastEvent.stopJ2
    };
  }

  private createNextEvent(stopJ1 = false, stopJ2 = false) {
    return {
      partie: this.partie,
      tour: this.lastEvent.tour,
      joueurActifId: this.lastEvent.joueurActifId,
      premierJoueurId: this.lastEvent.premierJoueurId,
      status: "TOUR_EN_COURS",
      cartesMainJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.main) : JSON.stringify(this.adversaire.main),
      cartesMainJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.main) : JSON.stringify(this.adversaire.main),
      cartesTerrainJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.terrain) : JSON.stringify(this.adversaire.terrain),
      cartesTerrainJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.terrain) : JSON.stringify(this.adversaire.terrain),
      cartesDeckJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.deck) : JSON.stringify(this.adversaire.deck),
      cartesDeckJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.deck) : JSON.stringify(this.adversaire.deck),
      cartesDefausseJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      cartesDefausseJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      stopJ1: stopJ1 ? stopJ1 : this.lastEvent.stopJ1,
      stopJ2: stopJ2 ? stopJ2 : this.lastEvent.stopJ2
    };
  }

  private createEndEvent() {
    this.updateScores();
    let scoreJoueur = this.joueur.score;
    let scoreAdversaire = this.adversaire.score;
    let vainqueurId = 0;
    if (scoreJoueur > scoreAdversaire) {
      this.vainqueur = this.joueur.nom;
      vainqueurId = this.joueur.id;
    } else if (scoreAdversaire > scoreJoueur) {
      this.vainqueur = this.adversaire.nom;
      vainqueurId = this.adversaire.id;
    } else if (scoreAdversaire == scoreJoueur) {
      this.vainqueur = 'égalité';
    }

    let scoreJ1 = this.joueur.id == this.partie.joueurUn.id ? this.joueur.score : this.adversaire.score;
    let scoreJ2 = this.joueur.id == this.partie.joueurDeux.id ? this.joueur.score : this.adversaire.score;

    let event: {
      partie: IPartie;
      vainqueurId: number;
      scoreJ1: number;
      scoreJ2: number;
    };

    event = {
      partie: this.partie,
      vainqueurId: vainqueurId,
      scoreJ1: scoreJ1,
      scoreJ2: scoreJ2
    };

    return event;
  }

  private createAbandonPEvent() {
    return {
      partie: this.partie,
      tour: this.lastEvent.tour,
      joueurActifId: this.lastEvent.joueurActifId,
      premierJoueurId: this.lastEvent.premierJoueurId,
      status: "ABANDON",
      cartesMainJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.main) : JSON.stringify(this.adversaire.main),
      cartesMainJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.main) : JSON.stringify(this.adversaire.main),
      cartesTerrainJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.terrain) : JSON.stringify(this.adversaire.terrain),
      cartesTerrainJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.terrain) : JSON.stringify(this.adversaire.terrain),
      cartesDeckJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.deck) : JSON.stringify(this.adversaire.deck),
      cartesDeckJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.deck) : JSON.stringify(this.adversaire.deck),
      cartesDefausseJoueurUn: this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      cartesDefausseJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      stopJ1: this.lastEvent.stopJ1,
      stopJ2: this.lastEvent.stopJ2
    };
  }

  private createAbandonResult() {
    this.vainqueur = this.adversaire.nom;

    let scoreJ1 = this.joueur.id == this.partie.joueurUn.id ? this.joueur.score : this.adversaire.score;
    let scoreJ2 = this.joueur.id == this.partie.joueurDeux.id ? this.joueur.score : this.adversaire.score;

    let event: {
      partie: IPartie;
      vainqueurId: number;
      scoreJ1: number;
      scoreJ2: number;
    };

    event = {
      partie: this.partie,
      vainqueurId: this.adversaire.id,
      scoreJ1: scoreJ1,
      scoreJ2: scoreJ2
    };

    return event;
  }

  private initCards() {
    this.joueur.deck.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
    this.joueur.main.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
    this.adversaire.deck.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
    this.adversaire.main.forEach(carte => {
      carte.bouclier = false;
      carte.insensible = false;
      carte.silence = false;
      carte.diffPuissanceInstant = 0;
      carte.diffPuissanceContinue = 0;
    });
  }

  private async playInstantEffect(carte: ICarte) {
    if (carte && carte.effet && carte.effet.code) {
      switch(carte.effet.code) {
        case EffetEnum.HEROISME: {
          let atLeastOne = false;
          for (let carteCible of this.adversaire.terrain) {
            if (this.getPuissanceTotale(carteCible) >= carte.effet.conditionPuissanceAdverse) {
              atLeastOne = true;
            }
          }
          if (atLeastOne) {
            carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
          }
          break;
        }
        case EffetEnum.IMMUNISE: {
          carte.bouclier = true;
          break;
        }
        case EffetEnum.INSENSIBLE: {
          carte.bouclier = true;
          carte.insensible = true;
          break;
        }
        case EffetEnum.SACRIFICE: {
          // @ts-ignore
          let carteSacrifiee = this.joueur.deck.shift();
          if (carteSacrifiee) {
            this.sendBotMessage(carteSacrifiee.nom + ' est sacrifiée');
            if (this.isFidelite(carteSacrifiee)) {
              this.joueur.deck.push(carteSacrifiee);
              this.sendBotMessage(carteSacrifiee.nom + ' est remise dans le deck');
              this.melangerDeck(this.joueur.deck);
            } else {
              this.joueur.defausse.push(carteSacrifiee);
            }
          }
          break;
        }
        case EffetEnum.ELECTROCUTION: {
          if (!this.hasPalissade(this.adversaire)) {
            // @ts-ignore
            const indexCarteAleatoire = Math.floor(Math.random() * this.adversaire.main.length);

            const carteAleatoire = this.adversaire.main[indexCarteAleatoire];

            if (this.isFidelite(carteAleatoire)) {
              this.adversaire.deck.push(carteAleatoire);
              this.sendBotMessage(carteAleatoire.nom + ' est remise dans le deck');
              this.melangerDeck(this.adversaire.deck);
            } else {
              this.adversaire.defausse.push(carteAleatoire);
            }

            this.adversaire.main.splice(indexCarteAleatoire, 1);
          }
          break;
        }
        case EffetEnum.RESET: {
          let tailleMain = this.joueur.main.length;
          while (this.joueur.main.length > 0) {
            // @ts-ignore
            this.joueur.deck.push(this.joueur.main.shift());
          }

          this.melangerDeck(this.joueur.deck);

          for (let i = 0; i < tailleMain; i++) {
            // @ts-ignore
            this.joueur.main.push(this.joueur.deck.shift());
          }
          break;
        }
        case EffetEnum.FUSION: {
          carte.bouclier = true;
          carte.insensible = true;

          // @ts-ignore
          let puissanceAjoutee = 0;
          for (let i = 0; i < this.joueur.terrain.length; i++) {
            let carteCible = this.joueur.terrain[i];
            if (this.memeTypeOuClan(carteCible, carte) && !carteCible.insensible) {
              puissanceAjoutee += carte.effet.valeurBonusMalus;

              // Retirer la carte du terrain et la placer dans la défausse
              const carteRetiree = this.joueur.terrain.splice(i, 1)[0];
              if (this.isCauchemard(carteRetiree)) {
                this.adversaire.terrain.push(carteRetiree);
                this.sendBotMessage(carteRetiree.nom + ' est envoyée sur le terrain adverse');
              }

              // Décrémenter la variable i pour éviter de sauter une carte
              i--;
            }
          }
          carte.diffPuissanceInstant += puissanceAjoutee;

          break;
        }
        case EffetEnum.SABOTAGE: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && !c.prison).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  // @ts-ignore
                  this.adversaire.terrain[indexCarte].diffPuissanceInstant -= carte.effet.valeurBonusMalus;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && !c.prison));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.SERVIABLE: {
          if (this.joueur.terrain.filter(c => !c.insensible && !c.prison && this.memeTypeOuClan(c, carte)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  // @ts-ignore
                  this.joueur.terrain[indexCarte].diffPuissanceInstant += carte.effet.valeurBonusMalus;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible && !c.prison && this.memeTypeOuClan(c, carte)));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.BOUCLIER: {
          if (this.joueur.terrain.filter(c => !c.insensible && !c.bouclier).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.joueur.terrain[indexCarte].bouclier = true;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible && !c.bouclier));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.RECYCLAGE: {
          if (!this.hasCrypte(this.adversaire)) {
            if (this.joueur.defausse.length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                    this.mettreCarteEnDeckEnMainDepuisDefausse(this.joueur.defausse[indexCarte]);
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.joueur.defausse);

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          }
          break;
        }
        case EffetEnum.CORRUPTION: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && !(c.clan.nom === this.nomCorrompu)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.adversaire.terrain[indexCarte].clan = this.clanCorrompu;
                  this.adversaire.terrain[indexCarte].type = this.typeCorrompu;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && !(c.clan.nom === this.nomCorrompu)));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.POSSESSION: {
          // @ts-ignore
          if (this.adversaire.terrain.filter(c => this.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse &&
            !c.bouclier && (c.clan.nom === this.nomCorrompu)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.joueur.terrain.push(this.adversaire.terrain[indexCarte]);
                  this.adversaire.terrain.splice(indexCarte, 1);
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            // @ts-ignore
            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => this.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse &&
              !c.bouclier && (c.clan.nom === this.nomCorrompu)));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.SILENCE: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.adversaire.terrain[indexCarte].silence = true;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.SAUVETAGE: {
          if (!this.hasCrypte(this.adversaire)) {
            if (this.joueur.defausse.length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                    this.recupererCarteEnMainDepuisDefausse(this.joueur.defausse[indexCarte]);
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.joueur.defausse);

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          }
          break;
        }
        case EffetEnum.TROC: {
          if (!this.hasPalissade(this.adversaire)) {
            if (this.joueur.main.length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                    const randomIndex = Math.floor(Math.random() * this.adversaire.main.length);

                    let carteJoueur = this.joueur.main[indexCarte];
                    this.joueur.main.splice(indexCarte, 1);

                    let carteAdversaire = this.adversaire.main[randomIndex];
                    this.adversaire.main.splice(randomIndex, 1);

                    this.adversaire.main.push(carteJoueur);
                    this.joueur.main.push(carteAdversaire);
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.joueur.main);

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.CASSEMURAILLE: {
          let adversaireHasProtecteurForet = this.adversaire.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;

          if (adversaireHasProtecteurForet) {
            if (this.adversaire.terrain.filter(c => c.bouclier && !(1 == c.clan.id || 8 == c.type.id)).length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                    this.adversaire.terrain[indexCarte].bouclier = false;
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => c.bouclier));

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          } else {
            if (this.adversaire.terrain.filter(c => c.bouclier).length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                    this.adversaire.terrain[indexCarte].bouclier = false;
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => c.bouclier));

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          }
          break;
        }
        case EffetEnum.RESURRECTION: {
          if (!this.hasCrypte(this.adversaire)) {
            if (this.joueur.defausse.filter(c => this.memeTypeOuClan(c, carte)).length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                    this.jouerNouvelleCarteDepuisDefausse(this.joueur.defausse[indexCarte]);
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.joueur.defausse.filter(c => this.memeTypeOuClan(c, carte)));

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.RENFORT: {
          if (this.joueur.main.filter(c => this.memeTypeOuClan(c, carte)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  this.jouerNouvelleCarte(this.joueur.main[indexCarte]);
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.joueur.main.filter(c => this.memeTypeOuClan(c, carte)));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.IMPOSTEUR: {
          if (this.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.memeTypeOuClan(c, carte)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarteSelectionnee = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  carte.effet = this.joueur.terrain[indexCarteSelectionnee].effet;

                  this.playInstantEffect(carte).then(r => {
                    this.updateEffetsContinusAndScores();
                  });
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible &&  !c.silence && c.effet && this.memeTypeOuClan(c, carte)));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.CONVERSION: {
          if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.joueur.terrain[indexCarte].type = carte.type;
                  this.joueur.terrain[indexCarte].clan = carte.clan;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.PRISON: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && !c.prison).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.adversaire.terrain[indexCarte].prison = true;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && !c.prison));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.VISION: {
          if (this.joueur.deck.filter.length > 0) {
            const troisPremieresCartes: ICarte[] = this.joueur.deck.slice(0, 3);
            this.showVisionCartesDialog(troisPremieresCartes);
            this.updateEffetsContinusAndScores();
          }
          break;
        }
        case EffetEnum.ESPION: {
          if (this.adversaire.deck.filter.length > 0) {
            this.showVisionCartesDialog(this.adversaire.deck);
            this.melangerDeck(this.adversaire.deck);
            this.updateEffetsContinusAndScores();
          }
          break;
        }
        case EffetEnum.MENTALISME: {
          if (!this.hasPalissade(this.adversaire)) {
            if (this.adversaire.main.filter.length > 0) {
              this.showVisionCartesDialog(this.adversaire.main);
            }
          }
          break;
        }
        case EffetEnum.SECTE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.adversaire.terrain.length;
          break;
        }
        case EffetEnum.CRUAUTE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.adversaire.defausse.length;
          break;
        }
        case EffetEnum.TERREUR: {
          for (let c of this.adversaire.terrain) {
            if (!c.bouclier && !c.prison) {
              c.diffPuissanceInstant -= carte.effet.valeurBonusMalus;
            }
          }
          break;
        }
        case EffetEnum.HERITAGE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.joueur.defausse.length;
          break;
        }
        case EffetEnum.SOUTIEN: {
          for (let c of this.joueur.terrain) {
            if (!c.insensible && !c.prison && this.memeTypeOuClan(c, carte)) {
              c.diffPuissanceInstant += carte.effet.valeurBonusMalus;
            }
          }
          break;
        }
        case EffetEnum.AMITIE: {
          for (let c of this.joueur.terrain) {
            if (!carte.insensible && !carte.prison && this.memeTypeOuClan(carte, c)) {
              carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
            }
          }
          break;
        }
        case EffetEnum.ENTERREMENT: {
          if (!this.hasCitadelle(this.adversaire)) {
            const carteDessusDeck = this.adversaire.deck.shift();

            if (carteDessusDeck) {
              if (this.isFidelite(carteDessusDeck)) {
                this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck');
                this.adversaire.deck.push(carteDessusDeck);
                this.melangerDeck(this.adversaire.deck);
              } else {
                this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse');
                this.adversaire.defausse.push(carteDessusDeck);
              }
            }
          }
          break;
        }
        case EffetEnum.DUOTERREMENT: {
          if (!this.hasCitadelle(this.adversaire)) {
            const carteDessusDeck = this.adversaire.deck.shift();

            if (carteDessusDeck) {
              if (this.isFidelite(carteDessusDeck)) {
                this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck');
                this.adversaire.deck.push(carteDessusDeck);
                this.melangerDeck(this.adversaire.deck);
              } else {
                this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse');
                this.adversaire.defausse.push(carteDessusDeck);
              }
            }

            const carteDessusDeck2 = this.adversaire.deck.shift();

            if (carteDessusDeck2) {
              if (this.isFidelite(carteDessusDeck2)) {
                this.sendBotMessage(carteDessusDeck2.nom + ' est remise dans le deck');
                this.adversaire.deck.push(carteDessusDeck2);
                this.melangerDeck(this.adversaire.deck);
              } else {
                this.sendBotMessage(carteDessusDeck2.nom + ' est envoyée dans la défausse');
                this.adversaire.defausse.push(carteDessusDeck2);
              }
            }
          }
          break;
        }
        case EffetEnum.MEUTE: {
          for (let i = this.joueur.main.length - 1; i >= 0; i--) {
            let c = this.joueur.main[i];
            if (carte.id === c.id) {
              this.joueur.terrain.push(c);
              this.joueur.main.splice(i, 1);
            }
          }
          break;
        }
        case EffetEnum.NUEE: {
          for (let c of this.joueur.terrain) {
            if (c.id == carte.id) {
              carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
            }
          }
          break;
        }
        case EffetEnum.POISSON: {
          if (!this.hasCitadelle(this.adversaire)) {
            this.adversaire.deck.push(this.poissonPourri);
            this.adversaire.deck.push(this.poissonPourri);
            this.melangerDeck(this.adversaire.deck);
          }
          break;
        }
        case EffetEnum.TRAHISON: {
          if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' trahit la carte ' + selectedCarte.nom);
                  const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  const carte = this.joueur.terrain[indexCarte];

                  if (this.isFidelite(carte)) {
                    this.joueur.deck.push(carte);
                    this.sendBotMessage(carte.nom + ' est remise dans le deck');
                    this.melangerDeck(this.joueur.deck);
                  } else if (this.isCauchemard(carte)) {
                    this.adversaire.terrain.push(carte);
                    this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse');
                  } else {
                    this.joueur.defausse.push(carte);
                  }

                  this.joueur.terrain.splice(indexCarte, 1);
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.TARDIF: {
          carte.diffPuissanceInstant += this.getTourAffiche();
          break;
        }
        case EffetEnum.MATINAL: {
          carte.diffPuissanceInstant -= this.getTourAffiche();
          break;
        }
        case EffetEnum.DEVOREUR: {
          if (!this.hasCrypte(this.adversaire)) {
            carte.diffPuissanceInstant += this.joueur.defausse.length;
            this.joueur.defausse = [];
          }
          break;
        }
        case EffetEnum.PARI: {
          let nbParis = 0;
          for (let c of this.joueur.terrain) {
            if (c.effet &&  c.effet.code === EffetEnum.PARI) {
              nbParis = nbParis + 1;
            }
          }

          if (nbParis == 2) {
            for (let c of this.joueur.terrain) {
              if (c.effet &&  c.effet.code === EffetEnum.PARI) {
                c.puissance = 7;
              }
            }
            carte.puissance = 7;
          }

          break;
        }
        case EffetEnum.ABSORPTION: {
          if (!this.hasCrypte(this.adversaire)) {
            this.joueur.defausse = [];
          }

          this.adversaire.defausse = [];
          break;
        }
        case EffetEnum.VOIX: {
          // @ts-ignore
          if (this.joueur.terrain.filter(c => c.silence).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.joueur.terrain[indexCarte].silence = false;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            // @ts-ignore
            this.showSelectionCarteDialog(this.joueur.terrain.filter(c => c.silence));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.MEURTRE: {
          if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' détruit la carte ' + selectedCarte.nom);
                  const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  const carte = this.joueur.terrain[indexCarte];

                  if (this.isFidelite(carte)) {
                    this.joueur.deck.push(carte);
                    this.sendBotMessage(carte.nom + ' est remise dans le deck');
                    this.melangerDeck(this.joueur.deck);
                  } else if (this.isCauchemard(carte)) {
                    this.adversaire.terrain.push(carte);
                    this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse');
                  } else {
                    this.joueur.defausse.push(carte);
                  }
                  this.joueur.terrain.splice(indexCarte, 1);
                }

                if (this.adversaire.terrain.filter(c => !c.bouclier).length > 0) {
                  let carteSelectionneeSub = this.secondeCarteSelectionnee$.subscribe(
                    (selectedCarte: ICarte) => {
                      if (selectedCarte != null) {
                        this.sendBotMessage(this.joueur.nom + ' détruit la carte ' + selectedCarte.nom);
                        const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                        const carte = this.adversaire.terrain[indexCarte];

                        if (this.isFidelite(carte)) {
                          this.adversaire.deck.push(carte);
                          this.sendBotMessage(carte.nom + ' est remise dans le deck');
                          this.melangerDeck(this.adversaire.deck);
                        } else if (this.isCauchemard(carte)) {
                          this.joueur.terrain.push(carte);
                          this.sendBotMessage(carte.nom + ' est envoyée sur le terrain');
                        } else {
                          this.adversaire.defausse.push(carte);
                        }

                        this.adversaire.terrain.splice(indexCarte, 1);
                      }
                      this.updateEffetsContinusAndScores();
                    },
                    (error: any) => console.error(error)
                  );

                  this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier));

                  this.secondeCarteSelectionnee$.subscribe(selectedCarte => {
                    carteSelectionneeSub.unsubscribe();
                  });
                } else {
                  this.sendBotMessage('Pas de cible disponible pour le pouvoir');
                }

                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        case EffetEnum.CHROPIE: {
          if (this.adversaire.defausse.filter(c => c.effet).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                  const indexCarteSelectionnee = this.adversaire.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  carte.effet = this.adversaire.defausse[indexCarteSelectionnee].effet;

                  this.playInstantEffect(carte).then(r => {
                    this.updateEffetsContinusAndScores();
                  });
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.defausse.filter(c => c.effet));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }
          break;
        }
        default: {
          //statements;
          break;
        }
      }
    }
  }

  private memeTypeOuClan(c: ICarte, carte: ICarte) {
    return (c.clan.id == carte.clan.id || c.type.id == carte.type.id);
  }

  private getPuissanceTotale(carte: ICarte) {
    return carte.prison ? 0 : (carte.puissance ? carte.puissance : 0) + (carte.diffPuissanceInstant ? carte.diffPuissanceInstant : 0) + (carte.diffPuissanceContinue ? carte.diffPuissanceContinue : 0);
  }

  private melangerDeck(deck: ICarte[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  showSelectionCarteDialog(cartes: ICarte[]): void {
    const ref = this.dialogService.open(SelectionCarteDialogComponent, {
      header: 'Sélectionnez une carte cible',
      width: '50%',
      data: { cartes },
      closable: false
    });

    ref.onClose.subscribe(selectedCarte => {
      this.carteSelectionneeSubject.next(selectedCarte);
    });
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
    let joueurHasProtecteurForet = this.joueur.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;
    let adversaireHasProtecteurForet = this.adversaire.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;

    // On remet à 0 les puissances continues avant de les recalculer
    for (let carte of this.joueur.terrain) {
      carte.diffPuissanceContinue = 0;

      if (joueurHasProtecteurForet) {
        if (1 == carte.clan.id || 8 == carte.type.id) {
          carte.bouclier = true;
        }
      }
    }
    for (let carte of this.adversaire.terrain) {
      carte.diffPuissanceContinue = 0;

      if (adversaireHasProtecteurForet) {
        if (1 == carte.clan.id || 8 == carte.type.id) {
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
              if (!carteCible.bouclier && carteCible.clan.nom === this.nomCorrompu) {
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
              if (!carteCible.bouclier && carteCible.clan.nom === this.nomCorrompu) {
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
    this.cd.detectChanges();
  }

  voirDefausse(defausse: ICarte[]) {
    this.showVisionCartesDialog(defausse);
  }

  private terminerPartie() {
    let event = this.createEndEvent();

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/enregistrerResultat', event).subscribe({
      next: response => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private getPartie() {
    this.http.get<IPartie>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partie?partieId=' + this.partieId).subscribe({
      next: partie => {
        this.partie = partie;
        this.initValues();
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
        // @ts-ignore
        this.lastEvent = evenementsPartie.at(-1);
        if (this.lastEvent && this.lastEvent.id > this.lastEventId) {
          this.lastEventId = this.lastEvent.id;
          this.updateGameFromLastEvent(this.lastEvent);
        }
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private hasCitadelle(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.CITADELLE) {
        result = true;
      }
    }

    return result;
  }

  private hasCrypte(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.CRYPTE) {
        result = true;
      }
    }

    return result;
  }

  private hasPalissade(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet && carte.effet.code == EffetEnum.PALISSADE) {
        result = true;
      }
    }

    return result;
  }

  confirmAbandon() {
    this.zone.run(() => {
      const ref = this.dialogService.open(ConfirmationDialogComponent, {
        header: 'Confirmation',
        width: '50%',
        height: '30%',
        data: { message: 'Voulez-vous vraiment abandonner ?' },
        closable: false
      });

      ref.onClose.subscribe((reponse: boolean) => {
        if (reponse) {
          this.abandon();
        }
      });
    });
  }

  abandon() {
    // @ts-ignore
    let event = this.createAbandonPEvent();

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
      next: response => {
        this.finDePartie = true;
        this.joueurAbandon = this.joueur.nom;

        let event = this.createAbandonResult();

        this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/enregistrerResultat', event).subscribe({
          next: response => {
          },
          error: error => {
            console.error('There was an error!', error);
          }
        });
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  clickedCarte(cardPath: string) {
    this.clickedCartePath = cardPath;
  }

  getJoueurColorClass(): string {
    if (this.finDePartie) {
      return this.estPremierJoueur ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    } else if (this.estJoueurActif) {
      return this.estPremierJoueur ? 'terrain-joueur-premier' : 'terrain-joueur-autre';
    } else {
      return this.estPremierJoueur ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    }
  }

  getAdvColorClass(): string {
    if (this.finDePartie) {
      return this.estPremierJoueur ? 'terrain-adv-autre-dark' : 'terrain-adv-premier-dark';
    } else if (this.estJoueurActif) {
      return this.estPremierJoueur ? 'terrain-adv-autre-dark' : 'terrain-adv-premier-dark';
    } else {
      return this.estPremierJoueur ? 'terrain-adv-autre' : 'terrain-adv-premier';
    }
  }

  sendBotMessage(message: string) {
    if (message && message != '') {
      let messageTchat: IChatPartieMessage = {id: 0, partieId: this.partieId, auteur: 'PampaBot', texte: message};

      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/chatMessages', messageTchat).subscribe({
        next: () => {

        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    }
  }

  getTourAffiche() {
    return Math.ceil((this.lastEvent ? this.lastEvent.tour : 0) / 2);
  }

  getVainqueurTexte() {
    let texteVainqueur = '';
    if (this.lastEvent.status == "ABANDON") {
      if (this.joueurAbandon == '') {
        this.joueurAbandon = this.adversaire.nom;
      }
      texteVainqueur = " Abandon de " + this.joueurAbandon;
    } else {
      if (this.vainqueur) {
        let scoreJoueur = this.joueur.score;
        let scoreAdversaire = this.adversaire.score;
        if (scoreJoueur > scoreAdversaire) {
          texteVainqueur = "Victoire de " + this.joueur.nom;
        } else if (scoreAdversaire > scoreJoueur) {
          texteVainqueur = " Victoire de " + this.adversaire.nom;
        } else if (scoreAdversaire == scoreJoueur) {
          texteVainqueur = 'C\'est une égalité ';
        }
      }
    }

    return texteVainqueur;
  }

  ngOnDestroy() {
    if (this.evenementsPartieSubscription) {
      this.evenementsPartieSubscription.unsubscribe();
    }

    this.sseService.closeEvenementsPartieEventSource();
  }
}
