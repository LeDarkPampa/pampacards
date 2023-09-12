import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../services/sse.service";
import {last, Subject, Subscription} from "rxjs";
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
@Component({
  selector: 'app-partie',
  templateUrl: './partie.component.html',
  styleUrls: ['./partie.component.css']
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
  carteSelectionneeSubject = new Subject<ICarte>();
  public carteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  vainqueur = "";
  carteJouee = false;
  carteDefaussee = false;
  chatMessages: IChatPartieMessage[] = [];
  message: string = '';
  clickedCartePath: string = '';
  tourAffiche = 0;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone,
              private sseService: SseService, private cd: ChangeDetectorRef) {
    this.userId = authService.userId;
  }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.partieId = params['id'];
      this.getPartie();
      this.getEventsPartie();
      this.getChatPartieMessages();
      this.subscribeToEvenementsPartieFlux();
      this.subscribeToChatMessagesFlux();
      this.cd.detectChanges();
    });
  }

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {

    if (this.lastEvent.status == "FIN_PARTIE" || this.lastEvent.status == "ABANDON") {
      this.terminerPartie();
    }

    this.estJoueurActif = lastEvent.joueurActifId == this.userId;
    this.tourAffiche = Math.ceil(lastEvent.tour / 2);


    if (this.lastEvent.joueurActifId != this.joueur.id || this.lastEvent.status != "TOUR_EN_COURS") {
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
      }
      // On pioche jusqu'à avoir 4 cartes en main si on est le joueur actif
      if (this.lastEvent.joueurActifId == this.userId) {
        while (this.joueur.main.length < 4) {
          this.piocherCarte();
        }
      }
    }


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
  }

  piocherCarte() {
    // Récupération de la première carte du deck
    const cartePiochee = this.joueur.deck.shift();

    // Ajout de la carte piochée à la fin de votre main
    // @ts-ignore
    this.joueur.main.push(cartePiochee);
  }

  onJouerCarte(carteId: number) {
    const index = this.joueur.main.findIndex(c => c.id === carteId);
    if (index !== -1) {
      const carteJouee = this.joueur.main.splice(index, 1)[0];
      this.carteJouee = true;
      if (carteJouee.effet && !carteJouee.effet.continu) {
        this.playInstantEffect(carteJouee).then(r => {
            this.joueur.terrain.push(carteJouee);
            this.updateEffetsContinusAndScores();
            this.sendUpdatedGame();
          }
        );
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
            this.joueur.terrain.push(carte);
          }
        );
      } else {
        this.joueur.terrain.push(carte);
      }
    }

    this.updateEffetsContinusAndScores();
  }

  jouerNouvelleCarteDepuisDefausse(carte: ICarte) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet && !carte.effet.continu) {
        this.playInstantEffect(carte).then(r => {
            this.joueur.terrain.push(carte);
          }
        );
      } else {
        this.joueur.terrain.push(carte);
      }
    }

    this.updateEffetsContinusAndScores();
  }

  onDefausserCarte(carteId: number) {
    const index = this.joueur.main.findIndex(c => c.id === carteId);
    if (index !== -1) {
      const carteJouee = this.joueur.main.splice(index, 1)[0];
      this.carteDefaussee = true;
      if (this.isFidelite(carteJouee)) {
        this.joueur.deck.push(carteJouee);
        this.melangerDeck(this.joueur.deck);
      } else {
        this.joueur.defausse.push(carteJouee);
      }
    }
    this.updateEffetsContinusAndScores();
    this.sendUpdatedGame();
  }

  private isFidelite(carteJouee: ICarte) {
    return carteJouee.effet && carteJouee.effet.code == EffetEnum.FIDELITE;
  }

  finDeTour() {
    if (this.estJoueurActif) {
      this.estJoueurActif = false;
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

  sendUpdatedGame() {
    // @ts-ignore
    let event = this.createNextEvent();

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
      next: response => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private createEndTurnEvent() {
    let event: {
      partie: IPartie;
      tour: number;
      joueurActifId: number;
      premierJoueurId: number;
      cartesDefausseJoueurUn: string;
      cartesDeckJoueurDeux: string;
      cartesMainJoueurUn: string;
      cartesDeckJoueurUn: string;
      cartesTerrainJoueurUn: string;
      cartesDefausseJoueurDeux: string;
      cartesTerrainJoueurDeux: string;
      cartesMainJoueurDeux: string;
      status: string
    };

    event = {
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
      cartesDefausseJoueurUn:this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      cartesDefausseJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse)
    };

    return event;
  }

  private createNextEvent() {
    let event: {
      partie: IPartie;
      tour: number;
      joueurActifId: number;
      premierJoueurId: number;
      cartesDefausseJoueurUn: string;
      cartesDeckJoueurDeux: string;
      cartesMainJoueurUn: string;
      cartesDeckJoueurUn: string;
      cartesTerrainJoueurUn: string;
      cartesDefausseJoueurDeux: string;
      cartesTerrainJoueurDeux: string;
      cartesMainJoueurDeux: string;
      status: string
    };

    event = {
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
      cartesDefausseJoueurUn:this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      cartesDefausseJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse)
    };

    return event;
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
    } else {
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
    let event: {
      partie: IPartie;
      tour: number;
      joueurActifId: number;
      premierJoueurId: number;
      cartesDefausseJoueurUn: string;
      cartesDeckJoueurDeux: string;
      cartesMainJoueurUn: string;
      cartesDeckJoueurUn: string;
      cartesTerrainJoueurUn: string;
      cartesDefausseJoueurDeux: string;
      cartesTerrainJoueurDeux: string;
      cartesMainJoueurDeux: string;
      status: string
    };

    event = {
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
      cartesDefausseJoueurUn:this.partie.joueurUn.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse),
      cartesDefausseJoueurDeux: this.partie.joueurDeux.id == this.userId ? JSON.stringify(this.joueur.defausse) : JSON.stringify(this.adversaire.defausse)
    };

    return event;
  }

  private createAbandonResult() {
    let vainqueurId = this.adversaire.id;
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
      vainqueurId: vainqueurId,
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

  private async playInstantEffect(carte: ICarte) {
    if (carte.effet && carte.effet.code) {
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
        case EffetEnum.SACRIFICE: {
          // @ts-ignore
          let carteSacrifiee = this.joueur.deck.shift();
          // @ts-ignore
          if (this.isFidelite(carteSacrifiee)) {
            // @ts-ignore
            this.joueur.deck.push(carteSacrifiee);
            this.melangerDeck(this.joueur.deck);
          } else {
            // @ts-ignore
            this.joueur.defausse.push(carteSacrifiee);
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
              if (this.isFidelite(carteRetiree)) {
                this.joueur.deck.push(carteRetiree);
                this.melangerDeck(this.joueur.deck);
              } else {
                this.joueur.defausse.push(carteRetiree);
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
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
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
          }
          break;
        }
        case EffetEnum.INSENSIBLE: {
          carte.bouclier = true;
          carte.insensible = true;
          break;
        }
        case EffetEnum.SERVIABLE: {
          if (this.joueur.terrain.filter(c => !c.insensible && !c.prison && this.memeTypeOuClan(c, carte)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
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
          }
          break;
        }
        case EffetEnum.BOUCLIER: {
          if (this.joueur.terrain.filter(c => !c.insensible && !c.bouclier).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
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
          }
          break;
        }
        case EffetEnum.RECYCLAGE: {
          if (!this.hasCrypte(this.adversaire)) {
            if (this.joueur.defausse.length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                    this.joueur.deck.push(this.joueur.defausse[indexCarte]);
                    this.joueur.defausse.splice(indexCarte, 1);
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.joueur.defausse);

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            }
          }
          break;
        }
        case EffetEnum.CORRUPTION: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && !c.corrompu).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.adversaire.terrain[indexCarte].corrompu = true;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && !c.corrompu));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          }
          break;
        }
        case EffetEnum.POSSESSION: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && c.corrompu
            && this.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.joueur.terrain.push(this.adversaire.terrain[indexCarte]);
                  this.adversaire.terrain.splice(indexCarte, 1);
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && c.corrompu
              && this.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          }
          break;
        }
        case EffetEnum.SILENCE: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && !c.silence).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  this.adversaire.terrain[indexCarte].silence = true;
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && !c.silence));

            this.carteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          }
          break;
        }
        case EffetEnum.SAUVETAGE: {
          if (!this.hasCrypte(this.adversaire)) {
            if (this.joueur.defausse.length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                    this.joueur.main.push(this.joueur.defausse[indexCarte]);
                    this.joueur.defausse.splice(indexCarte, 1);
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.joueur.defausse);

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
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
            }
          }
          break;
        }
        case EffetEnum.CASSEMURAILLE: {
          if (this.adversaire.terrain.filter(c => c.bouclier).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
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
          }
          break;
        }
        case EffetEnum.RESURRECTION: {
          if (!this.hasCrypte(this.adversaire)) {
            if (this.joueur.defausse.length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                    this.jouerNouvelleCarteDepuisDefausse(this.joueur.defausse[indexCarte]);
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.joueur.defausse);

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            }
          }
          break;
        }
        case EffetEnum.RENFORT: {
          if (this.joueur.main.filter(c => this.memeTypeOuClan(c, carte)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
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
          }
          break;
        }
        case EffetEnum.IMPOSTEUR: {
          if (this.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.memeTypeOuClan(c, carte)).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
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
          }
          break;
        }
        case EffetEnum.CONVERSION: {
          if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
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
          }
          break;
        }
        case EffetEnum.PRISON: {
          if (this.adversaire.terrain.filter(c => !c.bouclier && !c.prison).length > 0) {
            let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
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
                this.adversaire.deck.push(carteDessusDeck);
                this.melangerDeck(this.adversaire.deck);
              } else {
                this.adversaire.defausse.push(carteDessusDeck);
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
        default: {
          //statements;
          break;
        }
      }
    }
  }

  private memeTypeOuClan(c: ICarte, carte: ICarte) {
    return (c.clan.id == carte.clan.id || c.type.id == carte.type.id) && !c.corrompu;
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
    // On remet à 0 les puissances continues avant de les recalculer
    let joueurHasProtecteurForet = this.joueur.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;
    let adversaireHasProtecteurForet = this.adversaire.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;

    for (let carte of this.joueur.terrain) {
      carte.diffPuissanceContinue = 0;

      if (joueurHasProtecteurForet) {
        let protectrice = this.joueur.terrain.find(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET);
        if (protectrice && this.memeTypeOuClan(protectrice, carte)) {
          carte.bouclier = true;
        }
      }
    }
    for (let carte of this.adversaire.terrain) {
      carte.diffPuissanceContinue = 0;

      if (adversaireHasProtecteurForet) {
        let protectrice = this.adversaire.terrain.find(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET);
        if (protectrice && this.memeTypeOuClan(protectrice, carte)) {
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

  private terminerPartie() {
    this.finDePartie = true;

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
      if (carte.effet.code == EffetEnum.CITADELLE) {
        result = true;
      }
    }

    return result;
  }

  private hasCrypte(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet.code == EffetEnum.CRYPTE) {
        result = true;
      }
    }

    return result;
  }

  private hasPalissade(joueur: IPlayerState) : boolean {
    let result = false;

    for (let carte of joueur.terrain) {
      if (carte.effet.code == EffetEnum.PALISSADE) {
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

  sendMessage() {
    if (this.message && this.message != '') {
      let message: IChatPartieMessage = {id: 0, partieId: this.partieId, auteur: this.joueur.nom, texte: this.message};

      this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/chatMessages', message).subscribe({
        next: () => {
          this.getChatPartieMessages();
        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    }
    this.message = '';
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

  clickedCarte(cardPath: string) {
    this.clickedCartePath = cardPath;
  }
}
