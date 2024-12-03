import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {SseService} from "../services/sse.service";
import {finalize, first, Observable, Observer, of, Subject, Subscription, tap, throwError} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";
import {DialogService} from "primeng/dynamicdialog";
import {SelectionCarteDialogComponent} from "./selection-carte-dialog/selection-carte-dialog.component";
import {VisionCartesDialogComponent} from "./vision-cartes-dialog/vision-cartes-dialog.component";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";
import {CarteService} from "../services/carte.service";
import {catchError, map} from "rxjs/operators";
import {JoueurService} from "../services/joueur.service";
import {PartieService} from "../services/partie.service";
import {CarteEffetService} from "../services/carteEffet.service";
import {TchatService} from "../services/tchat.service";
import {PartieEventService} from "../services/partieEvent.service";
import {EvenementPartie} from "../classes/parties/EvenementPartie";
import {PlayerState} from "../classes/parties/PlayerState";
import {Partie} from "../classes/parties/Partie";
import {CartePartie} from "../classes/cartes/CartePartie";
import {EffetEnum} from "../enums/EffetEnum";
import {TournoiService} from "../services/tournoi.service";
import {Tournoi} from "../classes/competitions/Tournoi";
import {Ligue} from "../classes/competitions/Ligue";

@Component({
  selector: 'app-partie',
  templateUrl: './partie.component.html',
  styleUrls: ['./partie.component.css', '../app.component.css']
})
export class PartieComponent implements OnInit, OnDestroy {

  userId = 0;
  // @ts-ignore
  joueur: PlayerState;
  // @ts-ignore
  adversaire: PlayerState;
  // @ts-ignore
  partie: Partie;
  // @ts-ignore
  partieId: number;
  finDePartie = false;
  // @ts-ignore
  private evenementsPartieSubscription: Subscription;
  // @ts-ignore
  lastEvent: EvenementPartie;
  lastEventId: number = 0;
  estJoueurActif = signal(false);
  estPremierJoueur = signal(false);
  carteJouee = signal(false);
  carteDefaussee = signal(false);
  enAttente = signal(true);
  carteSelectionneeSubject = new Subject<CartePartie>();
  public carteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  public secondeCarteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  vainqueur = "";
  clickedCartePath: string = '';

  isFlashing: boolean = false;
  joueurAbandon: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone, private carteService: CarteService,
              private joueurService: JoueurService, private partieService: PartieService,
              private tournoiService: TournoiService,
              private partieEventService: PartieEventService, private router: Router,
              private tchatService: TchatService, private carteEffetService: CarteEffetService,
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

  private updateGameFromLastEvent(lastEvent: EvenementPartie) {
    if (this.lastEvent.status === "EN_ATTENTE") {
      this.enAttente.set(true);
      this.cd.detectChanges();
      return;
    }

    this.enAttente.set(false);

    if (this.lastEvent.status === "FIN_PARTIE" && !this.finDePartie) {
      this.finDePartie = true;
      if (this.joueur.id === this.partie.joueurUn.id) {
        this.terminerPartie();
      }
    }

    if (this.lastEvent.status === "ABANDON") {
      this.finDePartie = true;
    }

    this.estJoueurActif.set(lastEvent.joueurActifId === this.userId);

    const isNotTourEnCoursOrEmptyDeck = this.lastEvent.joueurActifId !== this.joueur.id
      || this.lastEvent.status !== "TOUR_EN_COURS"
      || (this.joueur.terrain.length === 0 && this.joueur.deck.length === 0);

    if (isNotTourEnCoursOrEmptyDeck) {
      this.updatePlayerAndOpponent(lastEvent);
    }

    if (this.lastEvent.status === "NOUVEAU_TOUR" && this.estJoueurActif()) {
      this.startNewTurn();
    }

    if (lastEvent.status === "DEBUT_PARTIE") {
      this.initCards();
    }

    this.updateEffetsContinusAndScores();
    this.cd.detectChanges();
  }

  private updatePlayerAndOpponent(lastEvent: EvenementPartie) {
    const isJoueurUn = this.partie.joueurUn.id === this.userId;
    const joueurId = isJoueurUn ? this.partie.joueurUn.id : this.partie.joueurDeux.id;
    const adversaireId = isJoueurUn ? this.partie.joueurDeux.id : this.partie.joueurUn.id;
    const joueurDeck = isJoueurUn ? lastEvent.cartesDeckJoueurUn : lastEvent.cartesDeckJoueurDeux;
    const adversaireDeck = isJoueurUn ? lastEvent.cartesDeckJoueurDeux : lastEvent.cartesDeckJoueurUn;
    const joueurMain = isJoueurUn ? lastEvent.cartesMainJoueurUn : lastEvent.cartesMainJoueurDeux;
    const adversaireMain = isJoueurUn ? lastEvent.cartesMainJoueurDeux : lastEvent.cartesMainJoueurUn;
    const joueurTerrain = isJoueurUn ? lastEvent.cartesTerrainJoueurUn : lastEvent.cartesTerrainJoueurDeux;
    const adversaireTerrain = isJoueurUn ? lastEvent.cartesTerrainJoueurDeux : lastEvent.cartesTerrainJoueurUn;
    const joueurDefausse = isJoueurUn ? lastEvent.cartesDefausseJoueurUn : lastEvent.cartesDefausseJoueurDeux;
    const adversaireDefausse = isJoueurUn ? lastEvent.cartesDefausseJoueurDeux : lastEvent.cartesDefausseJoueurUn;

    this.joueur.id = joueurId;
    this.joueur.deck = joueurDeck.length > 0 ? JSON.parse(joueurDeck) : [];
    this.joueur.main = joueurMain.length > 0 ? JSON.parse(joueurMain) : [];
    this.joueur.terrain = joueurTerrain.length > 0 ? JSON.parse(joueurTerrain) : [];
    this.joueur.defausse = joueurDefausse.length > 0 ? JSON.parse(joueurDefausse) : [];

    this.adversaire.id = adversaireId;
    this.adversaire.deck = adversaireDeck.length > 0 ? JSON.parse(adversaireDeck) : [];
    this.adversaire.main = adversaireMain.length > 0 ? JSON.parse(adversaireMain) : [];
    this.adversaire.terrain = adversaireTerrain.length > 0 ? JSON.parse(adversaireTerrain) : [];
    this.adversaire.defausse = adversaireDefausse.length > 0 ? JSON.parse(adversaireDefausse) : [];
  }

  private startNewTurn() {
    this.carteJouee.set(false);
    this.carteDefaussee.set(false);

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

    this.estPremierJoueur.set(this.partie.joueurUn.id === this.userId);
  }

  piocherCarte() {
    // @ts-ignore
    this.joueur.main.push(this.joueur.deck.shift());
  }

  onJouerCarte(index: number) {
    let stopJ1 = false;
    let stopJ2 = false;
    if (index !== -1) {
      const carteJouee = this.joueur.main.splice(index, 1)[0];
      this.carteJouee.set(true);
      this.sendBotMessage(this.joueur.nom + ' joue la carte ' + carteJouee.nom);
      if (carteJouee.effet && !carteJouee.effet.continu) {
        this.playInstantEffect(carteJouee).then(r => {
          if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEUR) {
            this.adversaire.terrain.push(carteJouee);
          } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEURPLUS) {
            carteJouee.puissance = -4;
            this.adversaire.terrain.push(carteJouee);
          } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.KAMIKAZE) {
            this.joueur.defausse.push(carteJouee);
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
          this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent, stopJ1, stopJ2);
        });
      } else {
        this.joueur.terrain.push(carteJouee);
        this.updateEffetsContinusAndScores();
        this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);
      }
    }
  }

  jouerNouvelleCarte(carte: CartePartie) {
    const index = this.joueur.main.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.main.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        this.playInstantEffect(carte).then(r => {
          if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEUR) {
            this.adversaire.terrain.push(carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
            carte.puissance = -4;
            this.adversaire.terrain.push(carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
            this.joueur.defausse.push(carte);
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
      if (carte && carte.effet.code == EffetEnum.STOP) {
        if (this.joueur.id == this.partie.joueurUn.id) {
          stopJ2 = true;
        } else if (this.joueur.id == this.partie.joueurDeux.id) {
          stopJ1 = true;
        }
      }

      this.updateEffetsContinusAndScores();
      this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent, stopJ1, stopJ2);
      this.updateEffetsContinusAndScores();
    }
  }

  jouerNouvelleCarteDepuisDefausse(carte: CartePartie) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }

        this.playInstantEffect(carte).then(r => {
          // @ts-ignore
          if (carte.effet.code == EffetEnum.SABOTEUR) {
            this.adversaire.terrain.push(carte);
          } else if (carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
            carte.puissance = -4;
            this.adversaire.terrain.push(carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
            this.joueur.defausse.push(carte);
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

  mettreCarteEnDeckEnMainDepuisDefausse(carte: CartePartie) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
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
      this.carteDefaussee.set(true);
      if (this.carteService.isFidelite(carteJouee)) {
        this.sendBotMessage(carteJouee.nom + ' est remise dans le deck');
        this.joueur.deck.push(carteJouee);
        this.partieService.melangerDeck(this.joueur.deck);
      } else {
        this.joueur.defausse.push(carteJouee);
      }
    }
    this.updateEffetsContinusAndScores();
    this.partieEventService.sendUpdatedGameAfterDefausse(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);
  }

  finDeTour() {
    if (this.estJoueurActif()) {
      let event = this.partieEventService.createEndTurnEvent(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);
      this.partieEventService.sendEvent(event);
    }
  }

  private initCards() {
    this.partieService.initPlayerCards(this.joueur);
    this.partieService.initPlayerCards(this.adversaire);
  }

  private async playInstantEffect(carte: CartePartie) {
    if (carte && carte.effet && carte.effet.code != 'NO') {
      switch (carte.effet.code) {
        case EffetEnum.HEROISME:
          this.carteEffetService.handleHeroisme(carte, this.adversaire);
          break;
        case EffetEnum.IMMUNISE:
          this.carteEffetService.addImmunise(carte);
          break;
        case EffetEnum.INSENSIBLE:
          this.carteEffetService.addInsensible(carte);
          break;
        case EffetEnum.SACRIFICE:
          this.carteEffetService.handleSacrifice(this.joueur, this.partie.id);
          break;
        case EffetEnum.ELECTROCUTION:
          this.handleElectrocution();
          break;
        case EffetEnum.RESET:
          this.carteEffetService.handleReset(this.joueur);
          break;
        case EffetEnum.FUSION:
          this.carteEffetService.handleFusion(carte, this.joueur, this.adversaire, this.partie);
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
          if (this.joueurService.hasPalissade(this.adversaire)) {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            break;
          }

          if (this.joueur.main.length === 0) {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
            break;
          }

          const carteSelectionneeSub = this.carteSelectionnee$
            .pipe(
              first(),
              tap(selectedCarte => {
                if (selectedCarte != null) {
                  this.sendBotMessage(`${this.joueur.nom} cible la carte ${selectedCarte.nom}`);
                  const indexCarte = this.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  const randomIndex = Math.floor(Math.random() * this.adversaire.main.length);

                  const carteJoueur = this.joueur.main.splice(indexCarte, 1)[0];
                  const carteAdversaire = this.adversaire.main.splice(randomIndex, 1)[0];

                  this.adversaire.main.push(carteJoueur);
                  this.joueur.main.push(carteAdversaire);
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

          this.showSelectionCarteDialog(this.joueur.main);
          break;
        }
        case EffetEnum.CASSEMURAILLE: {
          let adversaireHasProtecteurForet = this.adversaire.terrain.filter(c => c.effet && c.effet.code == EffetEnum.PROTECTEURFORET).length > 0;

          if (adversaireHasProtecteurForet) {
            if (this.adversaire.terrain.filter(c => c.bouclier && !(1 == c.clan.id || 8 == c.type.id)).length > 0) {
              let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
                (selectedCarte: CartePartie) => {
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
                (selectedCarte: CartePartie) => {
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
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.adversaire.terrain.length;
          break;
        }
        case EffetEnum.CRUAUTE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.adversaire.defausse.length;
          break;
        }
        case EffetEnum.TERREUR: {
          this.carteEffetService.handleTerror(carte, this.adversaire);
          break;
        }
        case EffetEnum.HERITAGE: {
          carte.diffPuissanceInstant += carte.effet.valeurBonusMalus * this.joueur.defausse.length;
          break;
        }
        case EffetEnum.EGOISME: {
          carte.diffPuissanceInstant -= carte.effet.valeurBonusMalus * this.joueur.terrain.length;
          break;
        }
        case EffetEnum.SOUTIEN: {
          this.carteEffetService.handleSoutien(carte, this.joueur);
          break;
        }
        case EffetEnum.AMITIE: {
          this.carteEffetService.handleAmitie(carte, this.joueur);
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
          this.carteEffetService.handleMeute(carte, this.joueur);
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
          this.carteEffetService.handleDevoreur(carte, this.joueur, this.adversaire);
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
          this.carteEffetService.handleAbsorption(this.joueur, this.adversaire);
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
          this.carteEffetService.handleResistanceInstant(carte, this.joueur);
          break;
        }
        case EffetEnum.SEPT: {
          this.carteEffetService.handleSeptEffect(carte, this.joueur, this.adversaire);

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

  private handlePoisson(carte: CartePartie) {
    if (!this.joueurService.hasCitadelle(this.adversaire)) {
      for (let i = 0; i < carte.effet.valeurBonusMalus; i++) {
        this.adversaire.deck.push(this.partieService.getPoissonPourri());
      }
      this.partieService.melangerDeck(this.adversaire.deck);
    }
  }

  private handleNuee(carte: CartePartie) {
    this.joueur.terrain.forEach(c => {
      if (c.id === carte.id) {
        carte.diffPuissanceInstant += carte.effet.valeurBonusMalus;
      }
    });
  }

  private handleEnterrement() {
    if (!this.joueurService.hasCitadelle(this.adversaire)) {
      const carteDessusDeck = this.adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck');
          this.adversaire.deck.push(carteDessusDeck);
          this.partieService.melangerDeck(this.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse');
          this.adversaire.defausse.push(carteDessusDeck);
        }
      }
    }
  }

  private handleDuoterrementEffect() {
    if (!this.joueurService.hasCitadelle(this.adversaire)) {
      const carteDessusDeck = this.adversaire.deck.shift();

      if (carteDessusDeck) {
        if (this.carteService.isFidelite(carteDessusDeck)) {
          this.sendBotMessage(carteDessusDeck.nom + ' est remise dans le deck');
          this.adversaire.deck.push(carteDessusDeck);
          this.partieService.melangerDeck(this.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck.nom + ' est envoyée dans la défausse');
          this.adversaire.defausse.push(carteDessusDeck);
        }
      }

      const carteDessusDeck2 = this.adversaire.deck.shift();

      if (carteDessusDeck2) {
        if (this.carteService.isFidelite(carteDessusDeck2)) {
          this.sendBotMessage(carteDessusDeck2.nom + ' est remise dans le deck');
          this.adversaire.deck.push(carteDessusDeck2);
          this.partieService.melangerDeck(this.adversaire.deck);
        } else {
          this.sendBotMessage(carteDessusDeck2.nom + ' est envoyée dans la défausse');
          this.adversaire.defausse.push(carteDessusDeck2);
        }
      }
    }
  }

  private handleMentalisme() {
    if (!this.joueurService.hasPalissade(this.adversaire) && this.adversaire.main.length > 0) {
      this.showVisionCartesDialog(this.adversaire.main);
    }
  }

  private handleQuatreEffect(carte: CartePartie) {
    carte.puissance = 4;
    if (!this.joueurService.hasPalissade(this.adversaire)) {
      if (this.joueur.main.length > 0 && this.adversaire.main.length > 0) {
        const randomIndexJoueur = Math.floor(Math.random() * this.joueur.main.length);
        const randomIndexAdversaire = Math.floor(Math.random() * this.adversaire.main.length);

        const carteJoueur = this.joueur.main.splice(randomIndexJoueur, 1)[0];
        const carteAdversaire = this.adversaire.main.splice(randomIndexAdversaire, 1)[0];

        this.adversaire.main.push(carteJoueur);
        this.joueur.main.push(carteAdversaire);
      } else {
        this.sendBotMessage('Pas de cible disponible pour le pouvoir');
      }
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleCinqEffect(carte: CartePartie) {
    carte.puissance = parseInt("5");
    if (!this.joueurService.hasPalissade(this.adversaire)) {
      const temp = this.joueur.main.slice();
      this.joueur.main = this.adversaire.main;
      this.adversaire.main = temp;
    }
  }

  private handleSixEffect(carte: CartePartie) {
    carte.puissance = parseInt("6");
    if (!this.joueurService.hasCitadelle(this.adversaire)) {
      const temp = this.joueur.deck.slice();
      this.joueur.deck = this.adversaire.deck;
      this.adversaire.deck = temp;
    }
  }

  private handleChropieEffect(carte: CartePartie) {
    const cartesAvecEffet = this.adversaire.defausse.filter(c => c.effet);
    if (cartesAvecEffet.length > 0) {
      this.handleSelection(carte, () => true, selectedCarte => {
        const indexCarteSelectionnee = this.adversaire.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
        carte.effet = this.adversaire.defausse[indexCarteSelectionnee].effet;
        this.playInstantEffect(carte).then(() => this.updateEffetsContinusAndScores());
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleSelection(carte: CartePartie, filterCondition: (c: CartePartie) => boolean, callback: (selectedCarte: CartePartie) => void) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: CartePartie) => {
        if (selectedCarte) {
          callback(selectedCarte);
          this.updateEffetsContinusAndScores();
        }
        carteSelectionneeSub.unsubscribe();
      },
      (error: any) => console.error(error)
    );

    this.showSelectionCarteDialog(this.joueur.terrain.filter(filterCondition));
  }

  private handleMeurtreEffect() {
    if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: CartePartie) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' détruit la carte ' + selectedCarte.nom);
            const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            const carte = this.joueur.terrain[indexCarte];

            if (this.carteService.isFidelite(carte)) {
              this.joueur.deck.push(carte);
              this.sendBotMessage(carte.nom + ' est remise dans le deck');
              this.partieService.melangerDeck(this.joueur.deck);
            } else if (this.carteService.isCauchemard(carte)) {
              this.adversaire.terrain.push(carte);
              this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse');
            } else {
              this.joueur.defausse.push(carte);
            }
            this.joueur.terrain.splice(indexCarte, 1);
          }

          if (this.adversaire.terrain.filter(c => !c.bouclier).length > 0) {
            let carteSelectionneeSub = this.secondeCarteSelectionnee$.subscribe(
              (selectedCarte: CartePartie) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(this.joueur.nom + ' détruit la carte ' + selectedCarte.nom);
                  const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  const carte = this.adversaire.terrain[indexCarte];

                  if (this.carteService.isFidelite(carte)) {
                    this.adversaire.deck.push(carte);
                    this.sendBotMessage(carte.nom + ' est remise dans le deck');
                    this.partieService.melangerDeck(this.adversaire.deck);
                  } else if (this.carteService.isCauchemard(carte)) {
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
  }

  private handleVoixEffect() {
    if (this.joueur.terrain.filter(c => c.silence).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: CartePartie) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.joueur.terrain[indexCarte].silence = false;
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.showSelectionCarteDialog(this.joueur.terrain.filter(c => c.silence));

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleTrahisonEffect() {
    if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: CartePartie) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' trahit la carte ' + selectedCarte.nom);
            const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            const carte = this.joueur.terrain[indexCarte];

            if (this.carteService.isFidelite(carte)) {
              this.joueur.deck.push(carte);
              this.sendBotMessage(carte.nom + ' est remise dans le deck');
              this.partieService.melangerDeck(this.joueur.deck);
            } else if (this.carteService.isCauchemard(carte)) {
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
  }

  private handleEspionEffect() {
    if (this.adversaire.deck.filter.length > 0) {
      this.showVisionCartesDialog(this.adversaire.deck);
      this.partieService.melangerDeck(this.adversaire.deck);
      this.updateEffetsContinusAndScores();
    }
  }

  private handleVisionEffect() {
    if (this.joueur.deck.filter.length > 0) {
      const troisPremieresCartes: CartePartie[] = this.joueur.deck.slice(0, 3);
      this.showVisionCartesDialog(troisPremieresCartes);
      this.updateEffetsContinusAndScores();
    }
  }

  private handlePrisonEffect() {
    if (this.adversaire.terrain.filter(c => !c.bouclier && !c.prison).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: CartePartie) => {
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

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleConversionEffect(carte: CartePartie) {
    if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: CartePartie) => {
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

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortEffect(carte: CartePartie) {
    if (this.joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
      this.handleRenfortSelection(carte);
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortSelection(carte: CartePartie) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: CartePartie) => {
        if (selectedCarte != null) {
          this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
          const indexCarte = this.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.jouerNouvelleCarte(this.joueur.main[indexCarte]);
        }
        this.updateEffetsContinusAndScores();
      },
      (error: any) => console.error(error)
    );

    this.showSelectionCarteDialog(this.joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)));

    this.carteSelectionnee$.subscribe(() => {
      carteSelectionneeSub.unsubscribe();
    });
  }

  private handleImposteurEffect(carte: CartePartie) {
    if (this.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.carteService.memeTypeOuClan(c, carte)).length > 0) {
      this.handleImposteurSelection(carte);
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleImposteurSelection(carte: CartePartie) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: CartePartie) => {
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

    this.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.carteService.memeTypeOuClan(c, carte)));

    this.carteSelectionnee$.subscribe(() => {
      carteSelectionneeSub.unsubscribe();
    });
  }

  private handleElectrocution() {
    if (!this.joueurService.hasPalissade(this.adversaire)) {
      const indexCarteAleatoire = Math.floor(Math.random() * this.adversaire.main.length);
      const carteAleatoire = this.adversaire.main[indexCarteAleatoire];

      if (this.carteService.isFidelite(carteAleatoire)) {
        this.adversaire.deck.push(carteAleatoire);
        this.sendBotMessage(`${carteAleatoire.nom} est remise dans le deck`);
        this.partieService.melangerDeck(this.adversaire.deck);
      } else {
        this.adversaire.defausse.push(carteAleatoire);
      }

      this.adversaire.main.splice(indexCarteAleatoire, 1);
    }
  }

  private handleTargetSelectionEffect(carte: CartePartie, effetCode: EffetEnum) {
    let targetTerrain: CartePartie[] = [];

    let applyEffect: (selectedCarte: CartePartie) => void;

    switch (effetCode) {
      case EffetEnum.SABOTAGE:
      case EffetEnum.KAMIKAZE:
        targetTerrain = this.adversaire.terrain.filter((c: CartePartie) => !c.bouclier && !c.prison);
        applyEffect = (selectedCarte: CartePartie) => {
          const indexCarte = this.adversaire.terrain.findIndex((carteCheck: CartePartie) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.adversaire.terrain[indexCarte].diffPuissanceInstant -= carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.SERVIABLE:
        targetTerrain = this.joueur.terrain.filter((c: CartePartie) => !c.insensible && !c.prison && this.carteService.memeTypeOuClan(c, carte));
        applyEffect = (selectedCarte: CartePartie) => {
          const indexCarte = this.joueur.terrain.findIndex((carteCheck: CartePartie) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.joueur.terrain[indexCarte].diffPuissanceInstant += carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.BOUCLIER:
        targetTerrain = this.joueur.terrain.filter((c: CartePartie) => !c.insensible && !c.bouclier);
        applyEffect = (selectedCarte: CartePartie) => {
          const indexCarte = this.joueur.terrain.findIndex((carteCheck: CartePartie) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.joueur.terrain[indexCarte].bouclier = true;
        };
        break;
      case EffetEnum.RECYCLAGE:
        targetTerrain = this.joueur.defausse;
        applyEffect = (selectedCarte: CartePartie) => {
          const indexCarte = this.joueur.defausse.findIndex((carteCheck: CartePartie) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.mettreCarteEnDeckEnMainDepuisDefausse(this.joueur.defausse[indexCarte]);
        };
        break;
      case EffetEnum.CORRUPTION:
        targetTerrain = this.adversaire.terrain.filter((c: CartePartie) => !c.bouclier && !(c.clan.nom === this.carteService.getNomCorrompu()));
        applyEffect = (selectedCarte: CartePartie) => {
          const indexCarte = this.adversaire.terrain.findIndex((carteCheck: CartePartie) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.adversaire.terrain[indexCarte].clan = this.partieService.getClanCorrompu();
          this.adversaire.terrain[indexCarte].type = this.partieService.getTypeCorrompu();
        };
        break;
      case EffetEnum.POSSESSION:
        targetTerrain = this.adversaire.terrain.filter((c: CartePartie) => {
          return this.carteService.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse &&
            !c.bouclier && (c.clan.nom === this.carteService.getNomCorrompu());
        });
        applyEffect = (selectedCarte: CartePartie) => {
          const indexCarte = this.adversaire.terrain.findIndex((carteCheck: CartePartie) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.joueur.terrain.push(this.adversaire.terrain[indexCarte]);
          this.adversaire.terrain.splice(indexCarte, 1);
        };
        break;
    }

    if (targetTerrain.length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: CartePartie) => {
          if (selectedCarte != null) {
            this.sendBotMessage(`${this.joueur.nom} cible la carte ${selectedCarte.nom}`);
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

  showSelectionCarteDialog(cartes: CartePartie[]): void {
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

  showVisionCartesDialog(cartes: CartePartie[]): void {
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
    this.carteEffetService.resetBoucliersEtPuissances(this.joueur);
    this.carteEffetService.resetBoucliersEtPuissances(this.adversaire);

    this.carteEffetService.appliquerEffetsContinus(this.joueur, this.adversaire);
    this.carteEffetService.appliquerEffetsContinus(this.adversaire, this.joueur);

    this.updateScores();
  }

  private handleSilenceEffect() {
    if (this.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)).length > 0) {
      const carteSelectionneeSub = this.selectAndHandleCard(this.adversaire.terrain.filter(c => !c.bouclier && !c.silence && (c.effet && c.effet.continu)))
        .subscribe((selectedCarte: CartePartie) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.adversaire.terrain[indexCarte].silence = true;
          }
          this.updateEffetsContinusAndScores();
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleSauvetageEffect() {
    if (!this.joueurService.hasCrypte(this.adversaire) && this.joueur.defausse.length > 0) {
      const carteSelectionneeSub = this.selectAndHandleCard(this.joueur.defausse)
        .subscribe((selectedCarte: CartePartie) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.recupererCarteEnMainDepuisDefausse(this.joueur.defausse[indexCarte]);
          }
          this.updateEffetsContinusAndScores();
        });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  recupererCarteEnMainDepuisDefausse(carte: CartePartie) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        this.joueur.main.push(carte);
      } else {
        this.joueur.main.push(carte);
      }
    }

    this.updateEffetsContinusAndScores();
  }

  private async handleResurrectionEffect(carte: CartePartie) {
    if (!this.joueurService.hasCrypte(this.adversaire)) {
      if (this.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
        let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
          (selectedCarte: CartePartie) => {
            if (selectedCarte != null) {
              this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
              const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
              this.jouerNouvelleCarteDepuisDefausse(this.joueur.defausse[indexCarte]);
            }
            this.updateEffetsContinusAndScores();
          },
          (error: any) => console.error(error)
        );

        this.showSelectionCarteDialog(this.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte)));

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

  private selectAndHandleCard(cards: CartePartie[]): Observable<CartePartie> {
    this.showSelectionCarteDialog(cards);

    return new Observable((observer: Observer<CartePartie>) => {
      const carteSelectionneeSub = this.carteSelectionnee$
        .pipe(
          first(),
          tap(selectedCarte => {
            if (selectedCarte) {
              this.sendBotMessage(`${this.joueur.nom} cible la carte ${selectedCarte.nom}`);
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

    for (let carte of this.joueur.terrain) {
      sommePuissancesJoueur += this.carteService.getPuissanceTotale(carte);
    }

    for (let carte of this.adversaire.terrain) {
      sommePuissancesAdversaire += this.carteService.getPuissanceTotale(carte);
    }

    this.joueur.score = sommePuissancesJoueur;
    this.adversaire.score = sommePuissancesAdversaire;
    this.cd.detectChanges();
  }

  voirDefausse(defausse: CartePartie[]) {
    this.showVisionCartesDialog(defausse);
  }

  terminerPartie(): void {
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

    const event = this.partieEventService.createEndEvent(vainqueurId, this.partie, this.joueur, this.adversaire);
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
      next: (partie: Partie) => {
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
      (evenementsPartie: EvenementPartie[]) => {
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

  getEventsPartie() {
    this.partieEventService.getEventsPartie(this.partieId).subscribe({
      next: (evenementsPartie: EvenementPartie[]) => {
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
    let event = this.partieEventService.createAbandonEvent(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);

    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvent', event).subscribe({
      next: response => {
        this.finDePartie = true;
        this.joueurAbandon = this.joueur.nom;
        this.vainqueur = this.adversaire.nom;

        this.partieEventService.sendAbandonResult(this.joueur, this.adversaire, this.partie);
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
      return this.estPremierJoueur() ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    } else if (this.estJoueurActif()) {
      return this.estPremierJoueur() ? 'terrain-joueur-premier' : 'terrain-joueur-autre';
    } else {
      return this.estPremierJoueur() ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    }
  }

  getAdvColorClass(): string {
    if (this.finDePartie) {
      return this.estPremierJoueur() ? 'terrain-adv-autre-dark' : 'terrain-adv-premier-dark';
    } else if (this.estJoueurActif()) {
      return this.estPremierJoueur() ? 'terrain-adv-autre-dark' : 'terrain-adv-premier-dark';
    } else {
      return this.estPremierJoueur() ? 'terrain-adv-autre' : 'terrain-adv-premier';
    }
  }

  sendBotMessage(message: string) {
    this.tchatService.sendMessage(message, this.partieId);
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
    } else if (this.finDePartie) {
      let scoreJoueur = this.joueur.score;
      let scoreAdversaire = this.adversaire.score;
      if (scoreJoueur > scoreAdversaire) {
        texteVainqueur = " Victoire de " + this.joueur.nom;
      } else if (scoreAdversaire > scoreJoueur) {
        texteVainqueur = " Victoire de " + this.adversaire.nom;
      } else if (scoreAdversaire == scoreJoueur) {
        texteVainqueur = 'C\'est une égalité ';
      }
    }

    return texteVainqueur;
  }

  retourCompetition() {
    if (this.partie.competitionId) {
      this.getCompetition(this.partie.competitionId).subscribe({
        next: competition => {
          if (competition.type === 'tournoi') {
            this.router.navigate(['/tournoi', competition.data.id]);
          } else if (competition.type === 'ligue') {
            this.router.navigate(['/ligue', competition.data.id]);
          }
        },
        error: err => {
          console.error('Erreur lors de la récupération de la compétition:', err);
        }
      });
    }
  }

  getCompetition(id: number): Observable<{ type: string, data: Tournoi | Ligue }> {
    return this.tournoiService.getTournoi(id).pipe(
      map(tournoi => ({ type: 'tournoi', data: tournoi } as { type: string, data: Tournoi | Ligue })),
      catchError(err => {
        if (err.status === 404) {
          return this.tournoiService.getLigue(id).pipe(
            map(ligue => {
              if (ligue) {
                return { type: 'ligue', data: ligue } as { type: string, data: Tournoi | Ligue };
              } else {
                throw new Error('Competition not found');
              }
            }),
            catchError(ligueErr => throwError(() => ligueErr))
          );
        } else {
          return throwError(() => err);
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.evenementsPartieSubscription) {
      this.evenementsPartieSubscription.unsubscribe();
    }

    this.sseService.closeEvenementsPartieEventSource();
  }
}
