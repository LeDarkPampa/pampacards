import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../services/sse.service";
import {finalize, first, Observable, Observer, of, Subject, Subscription, tap} from "rxjs";
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
import {CarteService} from "../services/carte.service";
import {catchError} from "rxjs/operators";
import {JoueurService} from "../services/joueur.service";
import {PartieService} from "../services/partie.service";
import {CarteEffetService} from "../services/carteEffet.service";
import {TchatService} from "../services/tchat.service";
import {PartieEventService} from "../services/partieEvent.service";
import {IPartieDatas} from "../interfaces/IPartieDatas";

@Component({
  selector: 'app-partie',
  templateUrl: './partie.component.html',
  styleUrls: ['./partie.component.css', '../app.component.css']
})
export class PartieComponent implements OnInit, OnDestroy {

  partieDatas: IPartieDatas = {
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
  carteSelectionneeSubject = new Subject<ICarte>();
  public carteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  public secondeCarteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  carteJouee = false;
  carteDefaussee = false;
  clickedCartePath: string = '';

  isFlashing: boolean = false;
  enAttente: boolean = true;


  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone, private carteService: CarteService,
              private joueurService: JoueurService, private partieService: PartieService,
              private partieEventService: PartieEventService,
              private tchatService: TchatService,
              private carteEffetService: CarteEffetService,
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
      this.updatePlayerAndOpponent(lastEvent, this.partie);
    }

    if (lastEvent.status === "NOUVEAU_TOUR" && this.estJoueurActif) {
      this.startNewTurn();
    } else {
      this.carteJouee = lastEvent.carteJouee;
      this.carteDefaussee = lastEvent.carteDefaussee;
    }

    if (lastEvent.status === "DEBUT_PARTIE") {
      this.initCards();
    }

    this.updateEffetsContinusAndScores();
    this.cd.detectChanges();
  }

  private updatePlayerAndOpponent(lastEvent: IEvenementPartie, partie: IPartie) {
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

    this.partieDatas.joueur.id = joueurId;
    this.partieDatas.joueur.deck = joueurDeck.length > 0 ? JSON.parse(joueurDeck) : [];
    this.partieDatas.joueur.main = joueurMain.length > 0 ? JSON.parse(joueurMain) : [];
    this.partieDatas.joueur.terrain = joueurTerrain.length > 0 ? JSON.parse(joueurTerrain) : [];
    this.partieDatas.joueur.defausse = joueurDefausse.length > 0 ? JSON.parse(joueurDefausse) : [];

    this.partieDatas.adversaire.id = adversaireId;
    this.partieDatas.adversaire.deck = adversaireDeck.length > 0 ? JSON.parse(adversaireDeck) : [];
    this.partieDatas.adversaire.main = adversaireMain.length > 0 ? JSON.parse(adversaireMain) : [];
    this.partieDatas.adversaire.terrain = adversaireTerrain.length > 0 ? JSON.parse(adversaireTerrain) : [];
    this.partieDatas.adversaire.defausse = adversaireDefausse.length > 0 ? JSON.parse(adversaireDefausse) : [];
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

  piocherCarte() {
    // @ts-ignore
    this.joueur.main.push(this.joueur.deck.shift());
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

          this.updateEffetsContinusAndScores();
          this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent, stopJ1, stopJ2);
        });
      } else {
        this.partieDatas.joueur.terrain.push(carteJouee);
        this.updateEffetsContinusAndScores();
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

      this.updateEffetsContinusAndScores();
      this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent, stopJ1, stopJ2);
      this.updateEffetsContinusAndScores();
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
          // @ts-ignore
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

    this.updateEffetsContinusAndScores();
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
    this.updateEffetsContinusAndScores();
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
    this.updateEffetsContinusAndScores();
    this.partieEventService.sendUpdatedGameAfterDefausse(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);
  }

  finDeTour() {
    if (this.estJoueurActif) {
      let event = this.partieEventService.createEndTurnEvent(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);
      this.partieEventService.sendEvent(event);
    }
  }

  private initCards() {
    this.partieService.initPlayerCards(this.partieDatas.joueur);
    this.partieService.initPlayerCards(this.partieDatas.adversaire);
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
          this.handleElectrocution();
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
          this.handleSilenceEffect();
          break;
        case EffetEnum.SAUVETAGE:
          this.handleSauvetageEffect();
          break;
        case EffetEnum.TROC: {
          if (this.joueurService.hasPalissade(this.partieDatas.adversaire)) {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            break;
          }

          if (this.partieDatas.joueur.main.length === 0) {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            break;
          }

          const carteSelectionneeSub = this.carteSelectionnee$
            .pipe(
              first(),
              tap(selectedCarte => {
                if (selectedCarte != null) {
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
                this.updateEffetsContinusAndScores();
              }),
              catchError(error => {
                console.error(error);
                return of(null);
              })
            )
            .subscribe();

          this.showSelectionCarteDialog(this.partieDatas.joueur.main);
          break;
        }
        case EffetEnum.CASSEMURAILLE: {
          let adversaireHasProtecteurForet = this.partieDatas.adversaire.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;

          if (adversaireHasProtecteurForet) {
            if (this.partieDatas.adversaire.terrain.filter(c => c.bouclier && !(1 == c.clan.id || 8 == c.type.id)).length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                    this.partieDatas.adversaire.terrain[indexCarte].bouclier = false;
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.partieDatas.adversaire.terrain.filter(c => c.bouclier));

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          } else {
            if (this.partieDatas.adversaire.terrain.filter(c => c.bouclier).length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: ICarte) => {
                  if (selectedCarte != null) {
                    this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
                    const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                    this.partieDatas.adversaire.terrain[indexCarte].bouclier = false;
                  }
                  this.updateEffetsContinusAndScores();
                },
                (error: any) => console.error(error)
              );

              this.showSelectionCarteDialog(this.partieDatas.adversaire.terrain.filter(c => c.bouclier));

              this.carteSelectionnee$.subscribe(selectedCarte => {
                carteSelectionneeSub.unsubscribe();
              });
            } else {
              this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            }
          }
          break;
        }
        case EffetEnum.RESURRECTION:
          await this.handleResurrectionEffect(carte);
          break;
        case EffetEnum.RENFORT:
          this.handleRenfortEffect(carte);
          break;
        case EffetEnum.IMPOSTEUR:
          this.handleImposteurEffect(carte);
          break;
        case EffetEnum.CONVERSION: {
          this.handleConversionEffect(carte);
          break;
        }
        case EffetEnum.PRISON: {
          this.handlePrisonEffect();
          break;
        }
        case EffetEnum.VISION: {
          this.handleVisionEffect();
          break;
        }
        case EffetEnum.ESPION: {
          this.handleEspionEffect();
          break;
        }
        case EffetEnum.MENTALISME: {
          this.handleMentalisme();
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
          this.handleEnterrement();
          break;
        }
        case EffetEnum.DUOTERREMENT: {
          this.handleDuoterrementEffect();
          break;
        }
        case EffetEnum.MEUTE: {
          this.carteEffetService.handleMeute(carte, this.partieDatas.joueur);
          break;
        }
        case EffetEnum.NUEE: {
          this.handleNuee(carte);
          break;
        }
        case EffetEnum.POISSON: {
          this.handlePoisson(carte);
          break;
        }
        case EffetEnum.TRAHISON: {
          this.handleTrahisonEffect();
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
          let nbParis = 0;
          for (let c of this.partieDatas.joueur.terrain) {
            if (c.effet &&  c.effet.code === EffetEnum.PARI) {
              nbParis = nbParis + 1;
            }
          }

          if (nbParis == 2) {
            for (let c of this.partieDatas.joueur.terrain) {
              if (c.effet &&  c.effet.code === EffetEnum.PARI) {
                c.puissance = 7;
              }
            }
            carte.puissance = 7;
          }

          break;
        }
        case EffetEnum.ABSORPTION: {
          this.carteEffetService.handleAbsorption(this.partieDatas.joueur, this.partieDatas.adversaire);
          break;
        }
        case EffetEnum.VOIX: {
          this.handleVoixEffect();
          break;
        }
        case EffetEnum.MEURTRE: {
          this.handleMeurtreEffect();
          break;
        }
        case EffetEnum.CHROPIE: {
          this.handleChropieEffect(carte);
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
          this.handleSixEffect(carte);

          break;
        }
        case EffetEnum.CINQ: {
          this.handleCinqEffect(carte);

          break;
        }
        case EffetEnum.QUATRE: {
          this.handleQuatreEffect(carte);
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

  private handlePoisson(carte: ICarte) {
    if (!this.joueurService.hasCitadelle(this.partieDatas.adversaire)) {
      for (let i = 0; i < carte.effet.valeurBonusMalus; i++) {
        this.partieDatas.adversaire.deck.push(this.partieService.getPoissonPourri());
      }
      this.partieService.melangerDeck(this.partieDatas.adversaire.deck);
    }
  }

  private handleNuee(carte: ICarte) {
    this.partieDatas.joueur.terrain.forEach(c => {
      if (c.id === carte.id) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  private handleEnterrement() {
    if (!this.joueurService.hasCitadelle(this.partieDatas.adversaire)) {
      const carteDessusDeck = this.partieDatas.adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck');
          this.partieDatas.adversaire.deck.push(carteDessusDeck);
          this.partieService.melangerDeck(this.partieDatas.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse');
          this.partieDatas.adversaire.defausse.push(carteDessusDeck);
        }
      }
    }
  }

  private handleDuoterrementEffect() {
    if (!this.joueurService.hasCitadelle(this.partieDatas.adversaire)) {
      const carteDessusDeck = this.partieDatas.adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck');
          this.partieDatas.adversaire.deck.push(carteDessusDeck);
          this.partieService.melangerDeck(this.partieDatas.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse');
          this.partieDatas.adversaire.defausse.push(carteDessusDeck);
        }
      }

      const carteDessusDeck2 = this.partieDatas.adversaire.deck.shift();

      if (carteDessusDeck2) {
        if (this.carteService.isFidelite(carteDessusDeck2)) {
          this.sendBotMessage(carteDessusDeck2.nom + ' est remise dans le deck');
          this.partieDatas.adversaire.deck.push(carteDessusDeck2);
          this.partieService.melangerDeck(this.partieDatas.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck2.nom + ' est envoyée dans la défausse');
          this.partieDatas.adversaire.defausse.push(carteDessusDeck2);
        }
      }
    }
  }

  private handleMentalisme() {
    if (!this.joueurService.hasPalissade(this.partieDatas.adversaire) && this.partieDatas.adversaire.main.length > 0) {
      this.showVisionCartesDialog(this.partieDatas.adversaire.main);
    }
  }

  private handleQuatreEffect(carte: ICarte) {
    carte.puissance = 4;
    if (!this.joueurService.hasPalissade(this.partieDatas.adversaire)) {
      if (this.partieDatas.joueur.main.length > 0 && this.partieDatas.adversaire.main.length > 0) {
        const randomIndexJoueur = Math.floor(Math.random() * this.partieDatas.joueur.main.length);
        const randomIndexAdversaire = Math.floor(Math.random() * this.partieDatas.adversaire.main.length);

        const carteJoueur = this.partieDatas.joueur.main.splice(randomIndexJoueur, 1)[0];
        const carteAdversaire = this.partieDatas.adversaire.main.splice(randomIndexAdversaire, 1)[0];

        this.partieDatas.adversaire.main.push(carteJoueur);
        this.partieDatas.joueur.main.push(carteAdversaire);
      } else {
        this.sendBotMessage('Pas de cible disponible pour le pouvoir');
      }
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleCinqEffect(carte: ICarte) {
    carte.puissance = parseInt("5");
    if (!this.joueurService.hasPalissade(this.partieDatas.adversaire)) {
      const temp = this.partieDatas.joueur.main.slice();
      this.partieDatas.joueur.main = this.partieDatas.adversaire.main;
      this.partieDatas.adversaire.main = temp;
    }
  }

  private handleSixEffect(carte: ICarte) {
    carte.puissance = parseInt("6");
    if (!this.joueurService.hasCitadelle(this.partieDatas.adversaire)) {
      const temp = this.partieDatas.joueur.deck.slice();
      this.partieDatas.joueur.deck = this.partieDatas.adversaire.deck;
      this.partieDatas.adversaire.deck = temp;
    }
  }

  private handleChropieEffect(carte: ICarte) {
    const cartesAvecEffet = this.partieDatas.adversaire.defausse.filter(c => c.effet);
    if (cartesAvecEffet.length > 0) {
      this.handleSelection(carte, () => true, selectedCarte => {
        const indexCarteSelectionnee = this.partieDatas.adversaire.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
        carte.effet = this.partieDatas.adversaire.defausse[indexCarteSelectionnee].effet;
        this.playInstantEffect(carte).then(() => this.updateEffetsContinusAndScores());
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleSelection(carte: ICarte, filterCondition: (c: ICarte) => boolean, callback: (selectedCarte: ICarte) => void) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: ICarte) => {
        if (selectedCarte) {
          callback(selectedCarte);
          this.updateEffetsContinusAndScores();
        }
        carteSelectionneeSub.unsubscribe();
      },
      (error: any) => console.error(error)
    );

    this.showSelectionCarteDialog(this.partieDatas.joueur.terrain.filter(filterCondition));
  }

  private handleMeurtreEffect() {
    if (this.partieDatas.joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' détruit la carte ' + selectedCarte.nom);
            const indexCarte = this.partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            const carte = this.partieDatas.joueur.terrain[indexCarte];

            if (this.carteService.isFidelite(carte)) {
              this.partieDatas.joueur.deck.push(carte);
              this.sendBotMessage(carte.nom + ' est remise dans le deck');
              this.partieService.melangerDeck(this.partieDatas.joueur.deck);
            } else if (this.carteService.isCauchemard(carte)) {
              this.partieDatas.adversaire.terrain.push(carte);
              this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse');
            } else {
              this.partieDatas.joueur.defausse.push(carte);
            }
            this.partieDatas.joueur.terrain.splice(indexCarte, 1);
          }

          if (this.partieDatas.adversaire.terrain.filter(c => !c.bouclier).length > 0) {
            let carteSelectionneeSub = this.secondeCarteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.partieDatas.joueur.nom + ' détruit la carte ' + selectedCarte.nom);
                  const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  const carte = this.partieDatas.adversaire.terrain[indexCarte];

                  if (this.carteService.isFidelite(carte)) {
                    this.partieDatas.adversaire.deck.push(carte);
                    this.sendBotMessage(carte.nom + ' est remise dans le deck');
                    this.partieService.melangerDeck(this.partieDatas.adversaire.deck);
                  } else if (this.carteService.isCauchemard(carte)) {
                    this.partieDatas.joueur.terrain.push(carte);
                    this.sendBotMessage(carte.nom + ' est envoyée sur le terrain');
                  } else {
                    this.partieDatas.adversaire.defausse.push(carte);
                  }

                  this.partieDatas.adversaire.terrain.splice(indexCarte, 1);
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.showSelectionCarteDialog(this.partieDatas.adversaire.terrain.filter(c => !c.bouclier));

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

      this.showSelectionCarteDialog(this.partieDatas.joueur.terrain.filter(c => !c.insensible));

      this.carteSelectionnee$.subscribe(selectedCarte => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleVoixEffect() {
    if (this.partieDatas.joueur.terrain.filter(c => c.silence).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.partieDatas.joueur.terrain[indexCarte].silence = false;
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.showSelectionCarteDialog(this.partieDatas.joueur.terrain.filter(c => c.silence));

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleTrahisonEffect() {
    if (this.partieDatas.joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' trahit la carte ' + selectedCarte.nom);
            const indexCarte = this.partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            const carte = this.partieDatas.joueur.terrain[indexCarte];

            if (this.carteService.isFidelite(carte)) {
              this.partieDatas.joueur.deck.push(carte);
              this.sendBotMessage(carte.nom + ' est remise dans le deck');
              this.partieService.melangerDeck(this.partieDatas.joueur.deck);
            } else if (this.carteService.isCauchemard(carte)) {
              this.partieDatas.adversaire.terrain.push(carte);
              this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse');
            } else {
              this.partieDatas.joueur.defausse.push(carte);
            }

            this.partieDatas.joueur.terrain.splice(indexCarte, 1);
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.showSelectionCarteDialog(this.partieDatas.joueur.terrain.filter(c => !c.insensible));

      this.carteSelectionnee$.subscribe(selectedCarte => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleEspionEffect() {
    if (this.partieDatas.adversaire.deck.filter.length > 0) {
      this.showVisionCartesDialog(this.partieDatas.adversaire.deck);
      this.partieService.melangerDeck(this.partieDatas.adversaire.deck);
      this.updateEffetsContinusAndScores();
    }
  }

  private handleVisionEffect() {
    if (this.partieDatas.joueur.deck.filter.length > 0) {
      const troisPremieresCartes: ICarte[] = this.partieDatas.joueur.deck.slice(0, 3);
      this.showVisionCartesDialog(troisPremieresCartes);
      this.updateEffetsContinusAndScores();
    }
  }

  private handlePrisonEffect() {
    if (this.partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.prison).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.partieDatas.adversaire.terrain[indexCarte].prison = true;
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.showSelectionCarteDialog(this.partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.prison));

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleConversionEffect(carte: ICarte) {
    if (this.partieDatas.joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.partieDatas.joueur.terrain[indexCarte].type = carte.type;
            this.partieDatas.joueur.terrain[indexCarte].clan = carte.clan;
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.showSelectionCarteDialog(this.partieDatas.joueur.terrain.filter(c => !c.insensible));

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortEffect(carte: ICarte) {
    if (this.partieDatas.joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
      this.handleRenfortSelection(carte);
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortSelection(carte: ICarte) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: ICarte) => {
        if (selectedCarte != null) {
          this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
          const indexCarte = this.partieDatas.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.jouerNouvelleCarte(this.partieDatas.joueur.main[indexCarte]);
        }
        this.updateEffetsContinusAndScores();
      },
      (error: any) => console.error(error)
    );

    this.showSelectionCarteDialog(this.partieDatas.joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)));

    this.carteSelectionnee$.subscribe(() => {
      carteSelectionneeSub.unsubscribe();
    });
  }

  private handleImposteurEffect(carte: ICarte) {
    if (this.partieDatas.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.carteService.memeTypeOuClan(c, carte)).length > 0) {
      this.handleImposteurSelection(carte);
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleImposteurSelection(carte: ICarte) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: ICarte) => {
        if (selectedCarte != null) {
          this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
          const indexCarteSelectionnee = this.partieDatas.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          carte.effet = this.partieDatas.joueur.terrain[indexCarteSelectionnee].effet;

          this.playInstantEffect(carte).then(r => {
            this.updateEffetsContinusAndScores();
          });
        }
        this.updateEffetsContinusAndScores();
      },
      (error: any) => console.error(error)
    );

    this.showSelectionCarteDialog(this.partieDatas.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.carteService.memeTypeOuClan(c, carte)));

    this.carteSelectionnee$.subscribe(() => {
      carteSelectionneeSub.unsubscribe();
    });
  }

  private handleElectrocution() {
    if (!this.joueurService.hasPalissade(this.partieDatas.adversaire)) {
      const indexCarteAleatoire = Math.floor(Math.random() * this.partieDatas.adversaire.main.length);
      const carteAleatoire = this.partieDatas.adversaire.main[indexCarteAleatoire];

      if (this.carteService.isFidelite(carteAleatoire)) {
        this.partieDatas.adversaire.deck.push(carteAleatoire);
        this.sendBotMessage(`${carteAleatoire.nom} est remise dans le deck`);
        this.partieService.melangerDeck(this.partieDatas.adversaire.deck);
      } else {
        this.partieDatas.adversaire.defausse.push(carteAleatoire);
      }

      this.partieDatas.adversaire.main.splice(indexCarteAleatoire, 1);
    }
  }

  private handleTargetSelectionEffect(carte: ICarte, effetCode: EffetEnum) {
    let targetTerrain: ICarte[] = [];

    let applyEffect: (selectedCarte: ICarte) => void;

    switch (effetCode) {
      case EffetEnum.SABOTAGE:
      case EffetEnum.KAMIKAZE:
        targetTerrain = this.partieDatas.adversaire.terrain.filter((c: ICarte) => !c.bouclier && !c.prison);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.adversaire.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.adversaire.terrain[indexCarte].diffPuissanceInstant -= carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.SERVIABLE:
        targetTerrain = this.partieDatas.joueur.terrain.filter((c: ICarte) => !c.insensible && !c.prison && this.carteService.memeTypeOuClan(c, carte));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.joueur.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.joueur.terrain[indexCarte].diffPuissanceInstant += carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.BOUCLIER:
        targetTerrain = this.partieDatas.joueur.terrain.filter((c: ICarte) => !c.insensible && !c.bouclier);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.joueur.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.joueur.terrain[indexCarte].bouclier = true;
        };
        break;
      case EffetEnum.RECYCLAGE:
        targetTerrain = this.partieDatas.joueur.defausse;
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.joueur.defausse.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.mettreCarteEnDeckEnMainDepuisDefausse(this.partieDatas.joueur.defausse[indexCarte]);
        };
        break;
      case EffetEnum.CORRUPTION:
        targetTerrain = this.partieDatas.adversaire.terrain.filter((c: ICarte) => !c.bouclier && !(c.clan.nom === this.carteService.getNomCorrompu()));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.adversaire.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.adversaire.terrain[indexCarte].clan = this.partieService.getClanCorrompu();
          this.partieDatas.adversaire.terrain[indexCarte].type = this.partieService.getTypeCorrompu();
        };
        break;
      case EffetEnum.POSSESSION:
        targetTerrain = this.partieDatas.adversaire.terrain.filter((c: ICarte) => {
          return this.carteService.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse &&
            !c.bouclier && (c.clan.nom === this.carteService.getNomCorrompu());
        });
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.partieDatas.adversaire.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieDatas.joueur.terrain.push(this.partieDatas.adversaire.terrain[indexCarte]);
          this.partieDatas.adversaire.terrain.splice(indexCarte, 1);
        };
        break;
    }

    if (targetTerrain.length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(`${this.partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`);
            applyEffect(selectedCarte);
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.showSelectionCarteDialog(targetTerrain);

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
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
    this.carteEffetService.resetBoucliersEtPuissances(this.partieDatas.joueur);
    this.carteEffetService.resetBoucliersEtPuissances(this.partieDatas.adversaire);

    this.carteEffetService.appliquerEffetsContinus(this.partieDatas.joueur, this.partieDatas.adversaire);
    this.carteEffetService.appliquerEffetsContinus(this.partieDatas.adversaire, this.partieDatas.joueur);

    this.updateScores();
  }

  private handleSilenceEffect() {
    if (this.partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)).length > 0) {
      const carteSelectionneeSub = this.selectAndHandleCard(this.partieDatas.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)))
        .subscribe((selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.partieDatas.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.partieDatas.adversaire.terrain[indexCarte].silence = true;
          }
          this.updateEffetsContinusAndScores();
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleSauvetageEffect() {
    if (!this.joueurService.hasCrypte(this.partieDatas.adversaire) && this.partieDatas.joueur.defausse.length > 0) {
      const carteSelectionneeSub = this.selectAndHandleCard(this.partieDatas.joueur.defausse)
        .subscribe((selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.partieDatas.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.recupererCarteEnMainDepuisDefausse(this.partieDatas.joueur.defausse[indexCarte]);
          }
          this.updateEffetsContinusAndScores();
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  recupererCarteEnMainDepuisDefausse(carte: ICarte) {
    const index = this.partieDatas.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.partieDatas.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        this.partieDatas.joueur.main.push(carte);
      } else {
        this.partieDatas.joueur.main.push(carte);
      }
    }

    this.updateEffetsContinusAndScores();
  }

  private async handleResurrectionEffect(carte: ICarte) {
    if (!this.joueurService.hasCrypte(this.partieDatas.adversaire)) {
      if (this.partieDatas.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
        let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
          (selectedCarte: ICarte) => {
            if (selectedCarte != null) {
              this.sendBotMessage(this.partieDatas.joueur.nom + ' cible la carte ' + selectedCarte.nom);
              const indexCarte = this.partieDatas.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
              this.jouerNouvelleCarteDepuisDefausse(this.partieDatas.joueur.defausse[indexCarte]);
            }
            this.updateEffetsContinusAndScores();
          },
          (error: any) => console.error(error)
        );

        this.showSelectionCarteDialog(this.partieDatas.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte)));

        this.carteSelectionnee$.subscribe(selectedCarte => {
          carteSelectionneeSub.unsubscribe();
        });
      } else {
        this.sendBotMessage('Pas de cible disponible pour le pouvoir');
      }
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private selectAndHandleCard(cards: ICarte[]): Observable<ICarte> {
    this.showSelectionCarteDialog(cards);

    return new Observable((observer: Observer<ICarte>) => {
      const carteSelectionneeSub = this.carteSelectionnee$
        .pipe(
          first(),
          tap(selectedCarte => {
            if (selectedCarte) {
              this.sendBotMessage(`${this.partieDatas.joueur.nom} cible la carte ${selectedCarte.nom}`);
              const indexCarte = cards.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
              observer.next(selectedCarte);
            } else {
              this.sendBotMessage('Aucune carte sélectionnée');
            }
          }),
          catchError(error => {
            console.error(error);
            observer.error(error);
            return of(null);
          }),
          finalize(() => {
            carteSelectionneeSub.unsubscribe();
          })
        )
        .subscribe();
    });
  }

  private updateScores() {
    let sommePuissancesJoueur = 0;
    let sommePuissancesAdversaire = 0;

    for (let carte of this.partieDatas.joueur.terrain) {
      sommePuissancesJoueur += this.carteService.getPuissanceTotale(carte);
    }

    for (let carte of this.partieDatas.adversaire.terrain) {
      sommePuissancesAdversaire += this.carteService.getPuissanceTotale(carte);
    }

    this.partieDatas.joueur.score = sommePuissancesJoueur;
    this.partieDatas.adversaire.score = sommePuissancesAdversaire;
    this.cd.detectChanges();
  }

  voirDefausse(defausse: ICarte[]) {
    this.showVisionCartesDialog(defausse);
  }

  terminerPartie(): void {
    this.updateScores();
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

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
      next: response => {
        this.partieDatas.finDePartie = true;
        this.partieDatas.nomJoueurAbandon = this.partieDatas.joueur.nom;
        this.partieDatas.nomVainqueur = this.partieDatas.adversaire.nom;

        this.partieEventService.sendAbandonResult(this.partieDatas.joueur, this.partieDatas.adversaire, this.partie);
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
