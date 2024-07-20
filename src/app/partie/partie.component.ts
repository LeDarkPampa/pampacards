import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../services/sse.service";
import {Subject, Subscription} from "rxjs";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {HttpClient} from "@angular/common/http";
import {IPartie} from "../interfaces/IPartie";
import {AuthentificationService} from "../services/authentification.service";
import {EffetEnum} from "../interfaces/EffetEnum";
import {ICarte} from "../interfaces/ICarte";
import {DialogService} from "primeng/dynamicdialog";
import {VisionCartesDialogComponent} from "./vision-cartes-dialog/vision-cartes-dialog.component";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";
import {CarteService} from "../services/carte.service";
import {JoueurService} from "../services/joueur.service";
import {PartieService} from "../services/partie.service";
import {CarteEffetService} from "../services/carteEffet.service";
import {TchatService} from "../services/tchat.service";
import {PartieEventService} from "../services/partieEvent.service";
import {IPartieDatas} from "../interfaces/IPartieDatas";
import {CustomDialogService} from "../services/customDialog.service";

@Component({
  selector: 'app-partie',
  templateUrl: './partie.component.html',
  styleUrls: ['./partie.component.css', '../app.component.css']
})
export class PartieComponent implements OnInit, OnDestroy {

  carteSelectionneeSubject = new Subject<ICarte>();
  public carteSelectionnee$ = this.carteSelectionneeSubject.asObservable();

  partieDatas: IPartieDatas = {
    partieId: 0,
    joueur: {
      id: 0,
      nom: '',
      main: [],
      terrain: [],
      deck: [],
      defausse: [],
      score: 0
    },
    adversaire: {
      id: 0,
      nom: '',
      main: [],
      terrain: [],
      deck: [],
      defausse: [],
      score: 0
    },
    finDePartie: false,
    lastEvent: {
      id: -1,
      status: '',
      tour: 0,
      joueurActifId: 0,
      premierJoueurId: 0,
      dateEvent: '',
      cartesDeckJoueurUn: '',
      cartesDeckJoueurDeux: '',
      cartesMainJoueurUn: '',
      cartesMainJoueurDeux: '',
      cartesTerrainJoueurUn: '',
      cartesTerrainJoueurDeux: '',
      cartesDefausseJoueurUn: '',
      cartesDefausseJoueurDeux: '',
      partie_id: 0,
      deckJoueurUnId: 0,
      deckJoueurDeuxId: 0,
      stopJ1: false,
      stopJ2: false,
      carteJouee: false,
      carteDefaussee: false
    },
    nomVainqueur: '',
    nomJoueurAbandon: ''
  };
  userId = 0;
  // @ts-ignore
  partie: IPartie;
  // @ts-ignore
  partieId: number;
  // @ts-ignore
  private evenementsPartieSubscription: Subscription;

  lastEventId: number = 0;
  estJoueurActif = false;
  estPremierJoueur: boolean = false;
  carteJouee = false;
  carteDefaussee = false;
  clickedCartePath: string = '';

  isFlashing: boolean = false;
  enAttente: boolean = true;

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone, private carteService: CarteService,
              private joueurService: JoueurService, private partieService: PartieService,
              private partieEventService: PartieEventService,
              private tchatService: TchatService, private customDialogService: CustomDialogService,
              private carteEffetService: CarteEffetService,
              private sseService: SseService, private cd: ChangeDetectorRef) {
    this.userId = authService.getUserId();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.partieId = params['id'];
      this.partieDatas.partieId = this.partieId;
      this.getPartie();
      this.getEventsPartie();
      this.subscribeToEvenementsPartieFlux();
      this.cd.detectChanges();
    });
  }

  private initCards() {
    this.partieService.initPlayerCards(this.partieDatas.joueur);
    this.partieService.initPlayerCards(this.partieDatas.adversaire);
  }

  private initValues() {
    let nomJoueur: string;
    let nomAdversaire: string;
    let idJoueur: number;
    let idAdversaire: number;

    if (this.partie.joueurUn.id === this.userId) {
      nomJoueur = this.partie.joueurUn.pseudo;
      idJoueur = this.partie.joueurUn.id;
      nomAdversaire = this.partie.joueurDeux.pseudo;
      idAdversaire = this.partie.joueurDeux.id;
    } else {
      nomJoueur = this.partie.joueurDeux.pseudo;
      idJoueur = this.partie.joueurDeux.id;
      nomAdversaire = this.partie.joueurUn.pseudo;
      idAdversaire = this.partie.joueurUn.id;
    }

    this.partieDatas.joueur = {
      id: idJoueur,
      nom: nomJoueur,
      main: [],
      terrain: [],
      deck: [],
      defausse: [],
      score: 0
    };

    this.partieDatas.adversaire = {
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


  finDeTour() {
    if (this.estJoueurActif) {
      let event = this.partieEventService.createEndTurnEvent(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);
      this.partieEventService.sendEvent(event);
    }
  }

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {
    if (this.partieDatas.lastEvent.status === "EN_ATTENTE") {
      this.enAttente = true;
      this.cd.detectChanges();
      return;
    }

    this.enAttente = false;

    if (lastEvent.status === "FIN_PARTIE" && !this.partieDatas.finDePartie) {
      this.partieDatas.finDePartie = true;
      if (this.partieDatas.joueur.id === this.partie.joueurUn.id) {
        this.terminerPartie();
      }
    }

    if (lastEvent.status === "ABANDON") {
      this.partieDatas.finDePartie = true;
    }

    this.estJoueurActif = lastEvent.joueurActifId === this.userId;

    const isNotTourEnCoursOrEmptyDeck = lastEvent.joueurActifId !== this.partieDatas.joueur.id
      || lastEvent.status !== "TOUR_EN_COURS"
      || (this.partieDatas.joueur.terrain.length === 0 && this.partieDatas.joueur.deck.length === 0);

    if (isNotTourEnCoursOrEmptyDeck) {
      this.updatePlayerAndOpponent(lastEvent, this.partie, this.partieDatas);
    }

    this.carteJouee = lastEvent.carteJouee;
    this.carteDefaussee = lastEvent.carteDefaussee;

    if (lastEvent.status === "NOUVEAU_TOUR" && this.estJoueurActif) {
      this.startNewTurn();
    }

    if (lastEvent.status === "DEBUT_PARTIE") {
      this.initCards();
    }

    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
    this.cd.detectChanges();
  }

  private updatePlayerAndOpponent(lastEvent: IEvenementPartie, partie: IPartie, partieDatas: IPartieDatas) {
    const isJoueurUn = partie.joueurUn.id === this.userId;
    const joueurId = isJoueurUn ? partie.joueurUn.id : partie.joueurDeux.id;
    const adversaireId = isJoueurUn ? partie.joueurDeux.id : partie.joueurUn.id;
    const joueurDeck = isJoueurUn ? lastEvent.cartesDeckJoueurUn : lastEvent.cartesDeckJoueurDeux;
    const adversaireDeck = isJoueurUn ? lastEvent.cartesDeckJoueurDeux : lastEvent.cartesDeckJoueurUn;
    const joueurMain = isJoueurUn ? lastEvent.cartesMainJoueurUn : lastEvent.cartesMainJoueurDeux;
    const adversaireMain = isJoueurUn ? lastEvent.cartesMainJoueurDeux : lastEvent.cartesMainJoueurUn;
    const joueurTerrain = isJoueurUn ? lastEvent.cartesTerrainJoueurUn : lastEvent.cartesTerrainJoueurDeux;
    const adversaireTerrain = isJoueurUn ? lastEvent.cartesTerrainJoueurDeux : lastEvent.cartesTerrainJoueurUn;
    const joueurDefausse = isJoueurUn ? lastEvent.cartesDefausseJoueurUn : lastEvent.cartesDefausseJoueurDeux;
    const adversaireDefausse = isJoueurUn ? lastEvent.cartesDefausseJoueurDeux : lastEvent.cartesDefausseJoueurUn;

    partieDatas.joueur.id = joueurId;
    partieDatas.joueur.deck = joueurDeck.length > 0 ? JSON.parse(joueurDeck) : [];
    partieDatas.joueur.main = joueurMain.length > 0 ? JSON.parse(joueurMain) : [];
    partieDatas.joueur.terrain = joueurTerrain.length > 0 ? JSON.parse(joueurTerrain) : [];
    partieDatas.joueur.defausse = joueurDefausse.length > 0 ? JSON.parse(joueurDefausse) : [];

    partieDatas.adversaire.id = adversaireId;
    partieDatas.adversaire.deck = adversaireDeck.length > 0 ? JSON.parse(adversaireDeck) : [];
    partieDatas.adversaire.main = adversaireMain.length > 0 ? JSON.parse(adversaireMain) : [];
    partieDatas.adversaire.terrain = adversaireTerrain.length > 0 ? JSON.parse(adversaireTerrain) : [];
    partieDatas.adversaire.defausse = adversaireDefausse.length > 0 ? JSON.parse(adversaireDefausse) : [];
  }

  private startNewTurn() {
    this.carteJouee = false;
    this.carteDefaussee = false;

    this.isFlashing = true; // Activez l'animation de flash

    // On pioche jusqu'à avoir 4 cartes en main si on est le joueur actif
    while (this.partieDatas.joueur.main.length < 4 && this.partieDatas.joueur.deck.length > 0) {
      this.piocherCarte();
    }

    // Désactivez l'animation de flash après un certain délai
    setTimeout(() => {
      this.isFlashing = false;
    }, 1000);
  }

  piocherCarte() {
    let carte = this.partieDatas.joueur.deck.shift();
    if (carte) {
      this.partieDatas.joueur.main.push(carte);
    }
  }

  onJouerCarte(index: number) {
    let stopJ1 = false;
    let stopJ2 = false;
    if (index !== -1) {
      const carteJouee = this.partieDatas.joueur.main.splice(index, 1)[0];
      this.carteJouee = true;
      this.sendBotMessage(this.partieDatas.joueur.nom + ' joue la carte ' + carteJouee.nom);
      if (carteJouee.effet && !carteJouee.effet.continu) {
        this.playInstantEffect(carteJouee).then(r => {
          if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEUR) {
            this.partieDatas.adversaire.terrain.push(carteJouee);
          } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEURPLUS) {
            carteJouee.puissance = -4;
            this.partieDatas.adversaire.terrain.push(carteJouee);
          } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.KAMIKAZE) {
            this.partieDatas.joueur.defausse.push(carteJouee);
          } else {
            this.partieDatas.joueur.terrain.push(carteJouee);
          }

          if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.STOP) {
            if (this.partieDatas.joueur.id == this.partie.joueurUn.id) {
              stopJ2 = true;
            } else if (this.partieDatas.joueur.id == this.partie.joueurDeux.id) {
              stopJ1 = true;
            }
          }

          this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
          this.cd.detectChanges();
          this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent, stopJ1, stopJ2);
        });
      } else {
        this.partieDatas.joueur.terrain.push(carteJouee);
        this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
        this.cd.detectChanges();
        this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);
      }
    }
  }

  jouerNouvelleCarte(carte: ICarte) {
    const index = this.partieDatas.joueur.main.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.partieDatas.joueur.main.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        this.playInstantEffect(carte).then(r => {
          if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEUR) {
            this.partieDatas.adversaire.terrain.push(carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
            carte.puissance = -4;
            this.partieDatas.adversaire.terrain.push(carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
            this.partieDatas.joueur.defausse.push(carte);
          } else {
            this.partieDatas.joueur.terrain.push(carte);
          }
        }
        );
      } else {
        this.partieDatas.joueur.terrain.push(carte);
      }

      let stopJ1 = false;
      let stopJ2 = false;
      if (carte && carte.effet.code == EffetEnum.STOP) {
        if (this.partieDatas.joueur.id == this.partie.joueurUn.id) {
          stopJ2 = true;
        } else if (this.partieDatas.joueur.id == this.partie.joueurDeux.id) {
          stopJ1 = true;
        }
      }

      this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
      this.cd.detectChanges();
      this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent, stopJ1, stopJ2);
      this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
      this.cd.detectChanges();
    }
  }

  jouerNouvelleCarteDepuisDefausse(carte: ICarte) {
    const index = this.partieDatas.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.partieDatas.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }

        this.playInstantEffect(carte).then(r => {
          if (carte.effet.code == EffetEnum.SABOTEUR) {
            this.partieDatas.adversaire.terrain.push(carte);
          } else if (carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
            carte.puissance = -4;
            this.partieDatas.adversaire.terrain.push(carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
            this.partieDatas.joueur.defausse.push(carte);
          } else {
            this.partieDatas.joueur.terrain.push(carte);
          }
          }
        );
      } else {
        this.partieDatas.joueur.terrain.push(carte);
      }
    }

    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
    this.cd.detectChanges();
  }

  mettreCarteEnDeckEnMainDepuisDefausse(carte: ICarte) {
    const index = this.partieDatas.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.partieDatas.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        this.partieDatas.joueur.deck.push(carte);
      } else {
        this.partieDatas.joueur.deck.push(carte);
      }
    }
    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
    this.cd.detectChanges();
  }

  onDefausserCarte(index: number) {
    if (index !== -1) {
      const carteJouee = this.partieDatas.joueur.main.splice(index, 1)[0];
      this.sendBotMessage(this.partieDatas.joueur.nom + ' défausse la carte ' + carteJouee.nom);
      this.carteDefaussee = true;
      if (this.carteService.isFidelite(carteJouee)) {
        this.sendBotMessage(carteJouee.nom + ' est remise dans le deck');
        this.partieDatas.joueur.deck.push(carteJouee);
        this.partieService.melangerDeck(this.partieDatas.joueur.deck);
      } else {
        this.partieDatas.joueur.defausse.push(carteJouee);
      }
    }
    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
    this.cd.detectChanges();
    this.partieEventService.sendUpdatedGameAfterDefausse(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);
  }

  private async playInstantEffect(carte: ICarte) {
    if (carte && carte.effet && carte.effet.code != 'NO') {
      switch (carte.effet.code) {
        case EffetEnum.HEROISME:
          this.carteEffetService.handleHeroisme(carte, this.partieDatas.adversaire);
          break;
        case EffetEnum.IMMUNISE:
          this.carteEffetService.addImmunise(carte);
          break;
        case EffetEnum.INSENSIBLE:
          this.carteEffetService.addInsensible(carte);
          break;
        case EffetEnum.SACRIFICE:
          this.carteEffetService.handleSacrifice(this.partieDatas.joueur, this.partie.id);
          break;
        case EffetEnum.ELECTROCUTION:
          this.carteEffetService.handleElectrocution(this.partieDatas);
          break;
        case EffetEnum.RESET:
          this.carteEffetService.handleReset(this.partieDatas.joueur);
          break;
        case EffetEnum.FUSION:
          this.carteEffetService.handleFusion(carte, this.partieDatas.joueur, this.partieDatas.adversaire, this.partie);
          break;
        case EffetEnum.SABOTAGE:
        case EffetEnum.KAMIKAZE:
        case EffetEnum.SERVIABLE:
        case EffetEnum.BOUCLIER:
        case EffetEnum.RECYCLAGE:
        case EffetEnum.CORRUPTION:
        case EffetEnum.POSSESSION:
          this.handleTargetSelectionEffect(carte, carte.effet.code);
          break;
        case EffetEnum.SILENCE:
          this.handleSilenceEffect(this.partieDatas);
          break;
        case EffetEnum.SAUVETAGE:
          this.handleSauvetageEffect(this.partieDatas);
          break;
        case EffetEnum.TROC: {
          if (this.joueurService.hasPalissade(this.partieDatas.adversaire)) {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            return;
          }

          if (this.partieDatas.joueur.main.length === 0) {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            return;
          }

          this.customDialogService.selectionnerCarte(this.partieDatas.joueur.main).then(selectedCarte => {
            if (selectedCarte) {
              this.sendBotMessage(`${this.partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`);
              const indexCarte = this.partieDatas.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
              const randomIndex = Math.floor(Math.random() * this.partieDatas.adversaire.main.length);

              const carteJoueur = this.partieDatas.joueur.main.splice(indexCarte, 1)[0];
              const carteAdversaire = this.partieDatas.adversaire.main.splice(randomIndex, 1)[0];

              this.partieDatas.adversaire.main.push(carteJoueur);
              this.partieDatas.joueur.main.push(carteAdversaire);
            } else {
              this.sendBotMessage('Aucune carte sélectionnée');
            }
            this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
            this.cd.detectChanges();
          }).catch(error => {
            console.error(error);
            this.sendBotMessage('Erreur lors de la sélection de la carte');
          });
          break;
        }
        case EffetEnum.CASSEMURAILLE: {
          this.handleCasseMuraille(this.partieDatas);
          break;
        }
        case EffetEnum.RESURRECTION:
          await this.handleResurrectionEffect(carte, this.partieDatas);
          break;
        case EffetEnum.RENFORT:
          this.handleRenfortEffect(carte, this.partieDatas);
          break;
        case EffetEnum.IMPOSTEUR:
          this.handleImposteurEffect(carte, this.partieDatas);
          break;
        case EffetEnum.CONVERSION: {
          this.handleConversionEffect(carte, this.partieDatas);
          break;
        }
        case EffetEnum.PRISON: {
          this.handlePrisonEffect(this.partieDatas);
          break;
        }
        case EffetEnum.VISION: {
          this.handleVisionEffect(this.partieDatas);
          break;
        }
        case EffetEnum.ESPION: {
          this.handleEspionEffect(this.partieDatas);
          break;
        }
        case EffetEnum.MENTALISME: {
          this.handleMentalisme(this.partieDatas);
          break;
        }
        case EffetEnum.SECTE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.partieDatas.adversaire.terrain.length;
          break;
        }
        case EffetEnum.CRUAUTE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.partieDatas.adversaire.defausse.length;
          break;
        }
        case EffetEnum.TERREUR: {
          this.carteEffetService.handleTerror(carte, this.partieDatas.adversaire);
          break;
        }
        case EffetEnum.HERITAGE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.partieDatas.joueur.defausse.length;
          break;
        }
        case EffetEnum.EGOISME: {
          carte.diffPuissanceInstant -= carte.effet.valeurBonusMalus * this.partieDatas.joueur.terrain.length;
          break;
        }
        case EffetEnum.SOUTIEN: {
          this.carteEffetService.handleSoutien(carte, this.partieDatas.joueur);
          break;
        }
        case EffetEnum.AMITIE: {
          this.carteEffetService.handleAmitie(carte, this.partieDatas.joueur);
          break;
        }
        case EffetEnum.ENTERREMENT: {
          this.carteEffetService.handleEnterrement(this.partieDatas);
          break;
        }
        case EffetEnum.DUOTERREMENT: {
          this.carteEffetService.handleDuoterrementEffect(this.partieDatas);
          break;
        }
        case EffetEnum.MEUTE: {
          this.carteEffetService.handleMeute(carte, this.partieDatas.joueur);
          break;
        }
        case EffetEnum.NUEE: {
          this.carteEffetService.handleNuee(carte, this.partieDatas);
          break;
        }
        case EffetEnum.POISSON: {
          this.carteEffetService.handlePoisson(carte, this.partieDatas);
          break;
        }
        case EffetEnum.TRAHISON: {
          this.handleTrahisonEffect(this.partieDatas);
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
        case EffetEnum.SECOND: {
          if (this.getTourAffiche() === 2) {
            carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
          }
          break;
        }
        case EffetEnum.TROISIEME: {
          if (this.getTourAffiche() === 3) {
            carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
          }
          break;
        }
        case EffetEnum.DEVOREUR: {
          this.carteEffetService.handleDevoreur(carte, this.partieDatas.joueur, this.partieDatas.adversaire);
          break;
        }
        case EffetEnum.PARI: {
          this.carteEffetService.handlePari(carte, this.partieDatas);

          break;
        }
        case EffetEnum.ABSORPTION: {
          this.carteEffetService.handleAbsorption(this.partieDatas.joueur, this.partieDatas.adversaire);
          break;
        }
        case EffetEnum.VOIX: {
          this.handleVoixEffect(this.partieDatas);
          break;
        }
        case EffetEnum.MEURTRE: {
          this.carteEffetService.handleMeurtreEffect(this.partieDatas);
          break;
        }
        case EffetEnum.CHROPIE: {
          this.handleChropieEffect(carte, this.partieDatas);
          break;
        }
        case EffetEnum.RESISTANCE_INSTANT: {
          this.carteEffetService.handleResistanceInstant(carte, this.partieDatas.joueur);
          break;
        }
        case EffetEnum.SEPT: {
          this.carteEffetService.handleSeptEffect(carte, this.partieDatas.joueur, this.partieDatas.adversaire);

          break;
        }
        case EffetEnum.SIX: {
          this.carteEffetService.handleSixEffect(carte, this.partieDatas);

          break;
        }
        case EffetEnum.CINQ: {
          this.carteEffetService.handleCinqEffect(carte, this.partieDatas);

          break;
        }
        case EffetEnum.QUATRE: {
          this.carteEffetService.handleQuatreEffect(carte, this.partieDatas);
          break;
        }
        case EffetEnum.BOUCLIERPLUS:
          this.carteEffetService.addBouclierPlus(carte);
          break;
        case EffetEnum.INSENSIBLEPLUS:
          this.carteEffetService.addInsensiblePlus(carte);
          break;
        default: {
          //statements;
          break;
        }
      }
    }
  }

  private handleCasseMuraille(partieDatas: IPartieDatas) {
    const adversaireHasProtecteurForet = partieDatas.adversaire.terrain.some(c => c.effet && c.effet.code === EffetEnum.PROTECTEURFORET);

    const bouclierCartesFiltre = (carte: ICarte) => carte.bouclier && (!adversaireHasProtecteurForet || !(carte.clan.id === 1 || carte.type.id === 8));

    if (partieDatas.adversaire.terrain.some(bouclierCartesFiltre)) {
      this.customDialogService.selectionnerCarte(partieDatas.adversaire.terrain.filter(bouclierCartesFiltre)).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`);
          const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.adversaire.terrain[indexCarte].bouclier = false;
        } else {
          this.sendBotMessage('Pas de cible disponible pour le pouvoir');
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
        this.cd.detectChanges();
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte');
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleMentalisme(partieDatas: IPartieDatas) {
    if (!this.joueurService.hasPalissade(partieDatas.adversaire) && partieDatas.adversaire.main.length > 0) {
      this.customDialogService.showVisionCartesDialog(partieDatas.adversaire.main);
    }
  }

  private handleChropieEffect(carte: ICarte, partieDatas: IPartieDatas) {
    const cartesAvecEffet = partieDatas.adversaire.defausse.filter(c => c.effet);
    if (cartesAvecEffet.length > 0) {
      this.customDialogService.selectionnerCarte(cartesAvecEffet).then(selectedCarte => {
        if (selectedCarte) {
          const indexCarteSelectionnee = partieDatas.adversaire.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          carte.effet = partieDatas.adversaire.defausse[indexCarteSelectionnee].effet;
          this.playInstantEffect(carte).then(() => {
            this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
            this.cd.detectChanges();
          });
        }
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte');
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleVoixEffect(partieDatas: IPartieDatas) {
    const cartesAvecSilence = partieDatas.joueur.terrain.filter(c => c.silence);
    if (cartesAvecSilence.length > 0) {
      this.customDialogService.selectionnerCarte(cartesAvecSilence).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`);
          const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.joueur.terrain[indexCarte].silence = false;
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
        this.cd.detectChanges();
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte');
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleTrahisonEffect(partieDatas: IPartieDatas) {
    const cartesNonInsensibles = partieDatas.joueur.terrain.filter(c => !c.insensible);
    if (cartesNonInsensibles.length > 0) {
      this.customDialogService.selectionnerCarte(cartesNonInsensibles).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${partieDatas.joueur.nom} trahit la carte ${selectedCarte.nom}`);
          const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

          const carte = partieDatas.joueur.terrain[indexCarte];

          if (this.carteService.isFidelite(carte)) {
            partieDatas.joueur.deck.push(carte);
            this.sendBotMessage(`${carte.nom} est remise dans le deck`);
            this.partieService.melangerDeck(partieDatas.joueur.deck);
          } else if (this.carteService.isCauchemard(carte)) {
            partieDatas.adversaire.terrain.push(carte);
            this.sendBotMessage(`${carte.nom} est envoyée sur le terrain adverse`);
          } else {
            partieDatas.joueur.defausse.push(carte);
          }

          partieDatas.joueur.terrain.splice(indexCarte, 1);
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
        this.cd.detectChanges();
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte');
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleEspionEffect(partieDatas: IPartieDatas) {
    if (partieDatas.adversaire.deck.filter.length > 0) {
      this.customDialogService.showVisionCartesDialog(partieDatas.adversaire.deck);
      this.partieService.melangerDeck(partieDatas.adversaire.deck);
      this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
      this.cd.detectChanges();
    }
  }

  private handleVisionEffect(partieDatas: IPartieDatas) {
    if (partieDatas.joueur.deck.filter.length > 0) {
      const troisPremieresCartes: ICarte[] = partieDatas.joueur.deck.slice(0, 3);
      this.customDialogService.showVisionCartesDialog(troisPremieresCartes);
      this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
      this.cd.detectChanges();
    }
  }

  private handlePrisonEffect(partieDatas: IPartieDatas) {
    const targetCards = partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.prison);

    if (targetCards.length > 0) {
      this.customDialogService.selectionnerCarte(targetCards)
        .then(selectedCarte => {
          if (selectedCarte != null) {
            this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            if (indexCarte !== -1) {
              partieDatas.adversaire.terrain[indexCarte].prison = true;
            }
          }
          this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
          this.cd.detectChanges();
        })
        .catch(error => {
          console.error(error);
          this.sendBotMessage('Erreur lors de la sélection de la carte');
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleConversionEffect(carte: ICarte, partieDatas: IPartieDatas) {
    const targetCards = partieDatas.joueur.terrain.filter(c => !c.insensible);

    if (targetCards.length > 0) {
      this.customDialogService.selectionnerCarte(targetCards)
        .then(selectedCarte => {
          if (selectedCarte != null) {
            this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            if (indexCarte !== -1) {
              partieDatas.joueur.terrain[indexCarte].type = carte.type;
              partieDatas.joueur.terrain[indexCarte].clan = carte.clan;
            }
          }
          this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
          this.cd.detectChanges();
        })
        .catch(error => {
          console.error(error);
          this.sendBotMessage('Erreur lors de la sélection de la carte');
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortEffect(carte: ICarte, partieDatas: IPartieDatas) {
    const targetCards = partieDatas.joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte));

    if (targetCards.length > 0) {
      this.customDialogService.selectionnerCarte(targetCards)
        .then(selectedCarte => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = partieDatas.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            if (indexCarte !== -1) {
              this.jouerNouvelleCarte(partieDatas.joueur.main[indexCarte]);
            }
          } else {
            this.sendBotMessage('Aucune carte sélectionnée');
          }
          this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
          this.cd.detectChanges();
        })
        .catch(error => {
          console.error(error);
          this.sendBotMessage('Erreur lors de la sélection de la carte');
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleImposteurEffect(carte: ICarte, partieDatas: IPartieDatas) {
    const targetCards = partieDatas.joueur.terrain.filter(c =>
      !c.insensible &&
      !c.silence &&
      c.effet &&
      this.carteService.memeTypeOuClan(c, carte)
    );

    if (targetCards.length > 0) {
      this.customDialogService.selectionnerCarte(targetCards)
        .then(selectedCarte => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarteSelectionnee = partieDatas.joueur.terrain.findIndex(carteCheck =>
              JSON.stringify(carteCheck) === JSON.stringify(selectedCarte)
            );

            if (indexCarteSelectionnee !== -1) {
              carte.effet = partieDatas.joueur.terrain[indexCarteSelectionnee].effet;

              this.playInstantEffect(carte).then(() => {
                this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
                this.cd.detectChanges();
              });
            }
          } else {
            this.sendBotMessage('Aucune carte sélectionnée');
          }
        })
        .catch(error => {
          console.error(error);
          this.sendBotMessage('Erreur lors de la sélection de la carte');
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleTargetSelectionEffect(carte: ICarte, effetCode: EffetEnum) {
    let targetTerrain: ICarte[] = [];
    let applyEffect: (selectedCarte: ICarte) => void;

    switch (effetCode) {
      case EffetEnum.SABOTAGE:
      case EffetEnum.KAMIKAZE:
        targetTerrain = this.partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.prison);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.adversaire.terrain[indexCarte].diffPuissanceInstant -= carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.SERVIABLE:
        targetTerrain = this.partieDatas.joueur.terrain.filter(c => !c.insensible && !c.prison && this.carteService.memeTypeOuClan(c, carte));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.joueur.terrain[indexCarte].diffPuissanceInstant += carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.BOUCLIER:
        targetTerrain = this.partieDatas.joueur.terrain.filter(c => !c.insensible && !c.bouclier);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.joueur.terrain[indexCarte].bouclier = true;
        };
        break;
      case EffetEnum.RECYCLAGE:
        targetTerrain = this.partieDatas.joueur.defausse;
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.mettreCarteEnDeckEnMainDepuisDefausse(this.partieDatas.joueur.defausse[indexCarte]);
        };
        break;
      case EffetEnum.CORRUPTION:
        targetTerrain = this.partieDatas.adversaire.terrain.filter(c => !c.bouclier && !(c.clan.nom === this.carteService.getNomCorrompu()));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.adversaire.terrain[indexCarte].clan = this.partieService.getClanCorrompu();
          this.partieDatas.adversaire.terrain[indexCarte].type = this.partieService.getTypeCorrompu();
        };
        break;
      case EffetEnum.POSSESSION:
        targetTerrain = this.partieDatas.adversaire.terrain.filter(c => {
          return this.carteService.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse && !c.bouclier && (c.clan.nom === this.carteService.getNomCorrompu());
        });
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.joueur.terrain.push(this.partieDatas.adversaire.terrain[indexCarte]);
          this.partieDatas.adversaire.terrain.splice(indexCarte, 1);
        };
        break;
    }

    if (targetTerrain.length > 0) {
      this.customDialogService.selectionnerCarte(targetTerrain).then(selectedCarte => {
        if (selectedCarte) {
          this.sendBotMessage(`${this.partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`);
          applyEffect(selectedCarte);
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
        this.cd.detectChanges();
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte');
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }





  private handleSilenceEffect(partieDatas: IPartieDatas) {
    const targetTerrain = partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu));
    if (targetTerrain.length > 0) {
      this.customDialogService.selectionnerCarte(targetTerrain).then(selectedCarte => {
        if (selectedCarte != null) {
          this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
          const indexCarte = partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          partieDatas.adversaire.terrain[indexCarte].silence = true;
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
        this.cd.detectChanges();
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte');
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleSauvetageEffect(partieDatas: IPartieDatas) {
    if (!this.joueurService.hasCrypte(partieDatas.adversaire) && partieDatas.joueur.defausse.length > 0) {
      this.customDialogService.selectionnerCarte(partieDatas.joueur.defausse).then(selectedCarte => {
        if (selectedCarte != null) {
          this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
          const indexCarte = partieDatas.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.recupererCarteEnMainDepuisDefausse(partieDatas.joueur.defausse[indexCarte], partieDatas);
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
        this.cd.detectChanges();
      }).catch(error => {
        console.error(error);
        this.sendBotMessage('Erreur lors de la sélection de la carte');
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  recupererCarteEnMainDepuisDefausse(carte: ICarte, partieDatas: IPartieDatas) {
    const index = partieDatas.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      partieDatas.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        partieDatas.joueur.main.push(carte);
      } else {
        partieDatas.joueur.main.push(carte);
      }
    }

    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
    this.cd.detectChanges();
  }

  private async handleResurrectionEffect(carte: ICarte, partieDatas: IPartieDatas) {
    if (!this.joueurService.hasCrypte(partieDatas.adversaire)) {
      const targetCards = partieDatas.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte));
      if (targetCards.length > 0) {
        try {
          const selectedCarte = await this.customDialogService.selectionnerCarte(targetCards);
          if (selectedCarte != null) {
            this.sendBotMessage(partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = partieDatas.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.jouerNouvelleCarteDepuisDefausse(partieDatas.joueur.defausse[indexCarte]);
          }
          this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
          this.cd.detectChanges();
        } catch (error) {
          console.error(error);
          this.sendBotMessage('Erreur lors de la sélection de la carte');
        }
      } else {
        this.sendBotMessage('Pas de cible disponible pour le pouvoir');
      }
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  voirDefausse(defausse: ICarte[]) {
    this.customDialogService.showVisionCartesDialog(defausse);
  }

  terminerPartie(): void {
    this.partieService.updateScores(this.partieDatas);
    this.cd.detectChanges();
    let scoreJoueur = this.partieDatas.joueur.score;
    let scoreAdversaire = this.partieDatas.adversaire.score;
    let vainqueurId = 0;
    if (scoreJoueur > scoreAdversaire) {
      this.partieDatas.nomVainqueur = this.partieDatas.joueur.nom;
      vainqueurId = this.partieDatas.joueur.id;
    } else if (scoreAdversaire > scoreJoueur) {
      this.partieDatas.nomVainqueur = this.partieDatas.adversaire.nom;
      vainqueurId = this.partieDatas.adversaire.id;
    } else if (scoreAdversaire == scoreJoueur) {
      this.partieDatas.nomVainqueur = 'égalité';
    }

    const event = this.partieEventService.createEndEvent(vainqueurId, this.partie, this.partieDatas.joueur, this.partieDatas.adversaire);
    this.partieEventService.enregistrerResultatFinPartie(event).subscribe({
      next: response => {
        // Traitement après enregistrement du résultat
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private getPartie() {
    this.partieEventService.getPartie(this.partieId).subscribe({
      next: (partie: IPartie) => {
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
        this.partieDatas.lastEvent = evenementsPartie.at(-1);
        if (this.partieDatas.lastEvent && this.partieDatas.lastEvent.id > this.lastEventId) {
          this.lastEventId = this.partieDatas.lastEvent.id;
          this.updateGameFromLastEvent(this.partieDatas.lastEvent);
        }
      },
      (error: any) => console.error(error)
    );
  }

  getEventsPartie() {
    this.partieEventService.getEventsPartie(this.partieId).subscribe({
      next: (evenementsPartie: IEvenementPartie[]) => {
        // @ts-ignore
        this.partieDatas.lastEvent = evenementsPartie.at(-1);
        if (this.partieDatas.lastEvent && this.partieDatas.lastEvent.id > this.lastEventId) {
          this.lastEventId = this.partieDatas.lastEvent.id;
          this.updateGameFromLastEvent(this.partieDatas.lastEvent);
        }
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
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
    let event = this.partieEventService.createAbandonEvent(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);

    this.partieEventService.sendAbandonEvent(event, this.partieDatas, this.partie);
  }

  clickedCarte(cardPath: string) {
    this.clickedCartePath = cardPath;
  }

  getJoueurColorClass(): string {
    if (this.partieDatas.finDePartie) {
      return this.estPremierJoueur ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    } else if (this.estJoueurActif) {
      return this.estPremierJoueur ? 'terrain-joueur-premier' : 'terrain-joueur-autre';
    } else {
      return this.estPremierJoueur ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    }
  }

  getAdvColorClass(): string {
    if (this.partieDatas.finDePartie) {
      return this.estPremierJoueur ? 'terrain-adv-autre-dark' : 'terrain-adv-premier-dark';
    } else if (this.estJoueurActif) {
      return this.estPremierJoueur ? 'terrain-adv-autre-dark' : 'terrain-adv-premier-dark';
    } else {
      return this.estPremierJoueur ? 'terrain-adv-autre' : 'terrain-adv-premier';
    }
  }

  sendBotMessage(message: string) {
    this.tchatService.sendMessage(message, this.partieId);
  }

  getTourAffiche() {
    return Math.ceil((this.partieDatas.lastEvent ? this.partieDatas.lastEvent.tour : 0) / 2);
  }

  getVainqueurTexte() {
    let texteVainqueur = '';
    if (this.partieDatas.lastEvent.status == "ABANDON") {
      if (this.partieDatas.nomJoueurAbandon == '') {
        this.partieDatas.nomJoueurAbandon = this.partieDatas.adversaire.nom;
      }
      texteVainqueur = " Abandon de " + this.partieDatas.nomJoueurAbandon;
    } else if (this.partieDatas.finDePartie) {
      let scoreJoueur = this.partieDatas.joueur.score;
      let scoreAdversaire = this.partieDatas.adversaire.score;
      if (scoreJoueur > scoreAdversaire) {
        texteVainqueur = " Victoire de " + this.partieDatas.joueur.nom;
      } else if (scoreAdversaire > scoreJoueur) {
        texteVainqueur = " Victoire de " + this.partieDatas.adversaire.nom;
      } else if (scoreAdversaire == scoreJoueur) {
        texteVainqueur = 'C\'est une égalité ';
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
