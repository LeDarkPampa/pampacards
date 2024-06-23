import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../services/sse.service";
import {first, of, Subject, Subscription, tap} from "rxjs";
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
import {PopupService} from "../services/popup.service";

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

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone, private carteService: CarteService,
              private joueurService: JoueurService, private partieService: PartieService,
              private partieEventService: PartieEventService, private popupService: PopupService,
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

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {
    if (this.lastEvent.status === "EN_ATTENTE") {
      this.enAttente = true;
      this.cd.detectChanges();
      return;
    }

    this.enAttente = false;

    if (this.lastEvent.status === "FIN_PARTIE" && !this.finDePartie) {
      this.finDePartie = true;
      if (this.joueur.id === this.partie.joueurUn.id) {
        this.terminerPartie();
      }
    }

    if (this.lastEvent.status === "ABANDON") {
      this.finDePartie = true;
    }

    this.estJoueurActif = lastEvent.joueurActifId === this.userId;

    const isNotTourEnCoursOrEmptyDeck = this.lastEvent.joueurActifId !== this.joueur.id
      || this.lastEvent.status !== "TOUR_EN_COURS"
      || (this.joueur.terrain.length === 0 && this.joueur.deck.length === 0);

    if (isNotTourEnCoursOrEmptyDeck) {
      this.partieService.updatePlayerAndOpponent(this.partie, this.joueur, this.adversaire, lastEvent, this.userId);
    }

    if (this.lastEvent.status === "NOUVEAU_TOUR" && this.estJoueurActif) {
      this.startNewTurn();
    }

    if (lastEvent.status === "DEBUT_PARTIE") {
      this.initCards();
    }

    this.updateEffetsContinusAndScores();
    this.cd.detectChanges();
  }

  private startNewTurn() {
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

    this.estPremierJoueur = this.partie.joueurUn.id === this.userId;
  }

  piocherCarte() {
    // @ts-ignore
    this.partieService.mettreCarteDansMain(this.joueur, this.joueur.deck.shift());
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
            this.partieService.jouerCarteSurTerrain(this.adversaire, carteJouee);
          } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.SABOTEURPLUS) {
            carteJouee.puissance = -4;
            this.partieService.jouerCarteSurTerrain(this.adversaire, carteJouee);
          } else if (carteJouee && carteJouee.effet && carteJouee.effet.code == EffetEnum.KAMIKAZE) {
            this.partieService.jouerCarteDansDefausse(this.joueur, carteJouee);
          } else {
            this.partieService.jouerCarteSurTerrain(this.joueur, carteJouee);
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
        this.partieService.jouerCarteSurTerrain(this.joueur, carteJouee);
        this.updateEffetsContinusAndScores();
        this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);
      }
    }
  }

  jouerNouvelleCarte(carte: ICarte) {
    const index = this.joueur.main.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.main.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        this.playInstantEffect(carte).then(r => {
          if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEUR) {
            this.partieService.jouerCarteSurTerrain(this.adversaire, carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
            carte.puissance = -4;
            this.partieService.jouerCarteSurTerrain(this.adversaire, carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
            this.partieService.jouerCarteDansDefausse(this.joueur, carte);
          } else {
            this.partieService.jouerCarteSurTerrain(this.joueur, carte);
          }
        }
        );
      } else {
        this.partieService.jouerCarteSurTerrain(this.joueur, carte);
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

  jouerNouvelleCarteDepuisDefausse(carte: ICarte) {
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
            this.partieService.jouerCarteSurTerrain(this.adversaire, carte);
          } else if (carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
            carte.puissance = -4;
            this.partieService.jouerCarteSurTerrain(this.adversaire, carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
            this.partieService.jouerCarteDansDefausse(this.joueur, carte);
          } else {
            this.partieService.jouerCarteSurTerrain(this.joueur, carte);
          }
          }
        );
      } else {this.partieService.jouerCarteSurTerrain(this.joueur, carte);
      }
    }

    this.updateEffetsContinusAndScores();
  }

  mettreCarteEnDeckEnMainDepuisDefausse(carte: ICarte) {
    const index = this.joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }
        this.partieService.mettreCarteDansDeck(this.joueur, carte);
      } else {
        this.partieService.mettreCarteDansDeck(this.joueur, carte);
      }
    }
    this.updateEffetsContinusAndScores();
  }

  onDefausserCarte(index: number) {
    if (index !== -1) {
      const carteJouee = this.joueur.main.splice(index, 1)[0];
      this.sendBotMessage(this.joueur.nom + ' défausse la carte ' + carteJouee.nom);
      this.carteDefaussee = true;
      if (this.carteService.isFidelite(carteJouee)) {
        this.sendBotMessage(carteJouee.nom + ' est remise dans le deck');
        this.partieService.mettreCarteDansDeck(this.joueur, carteJouee);
        this.partieService.melangerDeck(this.joueur.deck);
      } else {
        this.partieService.jouerCarteDansDefausse(this.joueur, carteJouee);
      }
    }
    this.updateEffetsContinusAndScores();
    this.partieEventService.sendUpdatedGameAfterDefausse(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);
  }

  finDeTour() {
    if (this.estJoueurActif) {
      let event = this.partieEventService.createEndTurnEvent(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);
      this.partieEventService.sendEvent(event);
    }
  }

  private initCards() {
    this.partieService.initPlayerCards(this.joueur);
    this.partieService.initPlayerCards(this.adversaire);
  }

  private async playInstantEffect(carte: ICarte) {
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
          this.carteEffetService.handleElectrocution(this.adversaire, this.partie.id);
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
          this.carteEffetService.handleSilenceEffect(this.joueur, this.adversaire, this.partieId);
          break;
        case EffetEnum.SAUVETAGE:
          this.carteEffetService.handleSauvetageEffect(this.joueur, this.adversaire, this.partieId);
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

          this.carteSelectionnee$
            .pipe(
              first(),
              tap(selectedCarte => {
                if (selectedCarte != null) {
                  this.sendBotMessage(`${this.joueur.nom} cible la carte ${selectedCarte.nom}`);
                  const indexCarte = this.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
                  const randomIndex = Math.floor(Math.random() * this.adversaire.main.length);

                  const carteJoueur = this.joueur.main.splice(indexCarte, 1)[0];
                  const carteAdversaire = this.adversaire.main.splice(randomIndex, 1)[0];

                  this.partieService.mettreCarteDansMain(this.adversaire, carteJoueur);
                  this.partieService.mettreCarteDansMain(this.joueur, carteAdversaire);

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

          this.popupService.showSelectionCarteDialog(this.joueur.main);
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

              this.popupService.showSelectionCarteDialog(this.adversaire.terrain.filter(c => c.bouclier));

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

              this.popupService.showSelectionCarteDialog(this.adversaire.terrain.filter(c => c.bouclier));

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
          this.handleRenfortEffect(carte, this.joueur);
          break;
        case EffetEnum.IMPOSTEUR:
          this.handleImposteurEffect(carte);
          break;
        case EffetEnum.CONVERSION: {
          this.handleConversionEffect(carte);
          break;
        }
        case EffetEnum.PRISON: {
          this.handlePrisonEffect(this.joueur, this.adversaire);
          break;
        }
        case EffetEnum.VISION: {
          this.carteEffetService.handleVisionEffect(this.joueur);
          break;
        }
        case EffetEnum.ESPION: {
          this.carteEffetService.handleEspionEffect(this.joueur, this.adversaire);
          break;
        }
        case EffetEnum.MENTALISME: {
          this.carteEffetService.handleMentalisme(this.adversaire);
          break;
        }
        case EffetEnum.SECTE: {
          this.carteEffetService.handleSecteEffect(carte, this.adversaire);
          break;
        }
        case EffetEnum.CRUAUTE: {
          this.carteEffetService.handleCruauteEffect(carte, this.adversaire);
          break;
        }
        case EffetEnum.TERREUR: {
          this.carteEffetService.handleTerror(carte, this.adversaire);
          break;
        }
        case EffetEnum.HERITAGE: {
          this.carteEffetService.handleHeritageEffect(carte, this.joueur);
          break;
        }
        case EffetEnum.EGOISME: {
          this.carteEffetService.handleEgoismeEffect(carte, this.joueur);
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
          this.carteEffetService.handleEnterrement(this.adversaire, this.partie.id);
          break;
        }
        case EffetEnum.DUOTERREMENT: {
          this.carteEffetService.handleDuoterrement(this.adversaire, this.partie.id);
          break;
        }
        case EffetEnum.MEUTE: {
          this.carteEffetService.handleMeute(carte, this.joueur);
          break;
        }
        case EffetEnum.NUEE: {
          this.carteEffetService.handleNuee(this.joueur, carte);
          break;
        }
        case EffetEnum.POISSON: {
          this.carteEffetService.handlePoisson(this.adversaire, carte);
          break;
        }
        case EffetEnum.TRAHISON: {
          this.handleTrahisonEffect(this.joueur, this.adversaire, this.partieId);
          break;
        }
        case EffetEnum.TARDIF: {
          this.carteEffetService.handleTardif(carte, this.getTourAffiche());
          break;
        }
        case EffetEnum.MATINAL: {
          this.carteEffetService.handleMatinal(carte, this.getTourAffiche());
          break;
        }
        case EffetEnum.SECOND: {
          this.carteEffetService.handleSecond(carte, this.getTourAffiche());
          break;
        }
        case EffetEnum.TROISIEME: {
          this.carteEffetService.handleTroisieme(carte, this.getTourAffiche());
          break;
        }
        case EffetEnum.DEVOREUR: {
          this.carteEffetService.handleDevoreur(carte, this.joueur, this.adversaire);
          break;
        }
        case EffetEnum.PARI: {
          this.carteEffetService.handlePari(this.joueur, carte);
          break;
        }
        case EffetEnum.ABSORPTION: {
          this.carteEffetService.handleAbsorption(this.joueur, this.adversaire);
          break;
        }
        case EffetEnum.VOIX: {
          this.handleVoixEffect(this.joueur);
          break;
        }
        case EffetEnum.MEURTRE: {
          this.handleMeurtreEffect(this.joueur, this.adversaire);
          break;
        }
        case EffetEnum.CHROPIE: {
          this.handleChropieEffect(carte, this.adversaire);
          break;
        }
        case EffetEnum.RESISTANCE_INSTANT: {
          this.carteEffetService.handleResistanceInstant(carte, this.joueur);
          break;
        }
        case EffetEnum.SEPT: {
          this.carteEffetService.handleSept(carte, this.joueur, this.adversaire);

          break;
        }
        case EffetEnum.SIX: {
          this.carteEffetService.handleSixEffect(this.joueur, this.adversaire, carte);

          break;
        }
        case EffetEnum.CINQ: {
          this.carteEffetService.handleCinqEffect(this.joueur, this.adversaire, carte);

          break;
        }
        case EffetEnum.QUATRE: {
          this.carteEffetService.handleQuatreEffect(this.joueur, this.adversaire, carte, this.partie.id);
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

  private handleChropieEffect(carte: ICarte, adversaire: IPlayerState) {
    const cartesAvecEffet = adversaire.defausse.filter(c => c.effet);
    if (cartesAvecEffet.length > 0) {
      this.handleSelection(carte, () => true, selectedCarte => {
        const indexCarteSelectionnee = adversaire.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
        carte.effet = this.adversaire.defausse[indexCarteSelectionnee].effet;
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

    this.popupService.showSelectionCarteDialog(this.joueur.terrain.filter(filterCondition));
  }

  private handleMeurtreEffect(joueur: IPlayerState, adversaire: IPlayerState) {
    if (joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(joueur.nom + ' détruit la carte ' + selectedCarte.nom);
            const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            const carte = joueur.terrain[indexCarte];

            if (this.carteService.isFidelite(carte)) {
              this.partieService.mettreCarteDansDeck(joueur, carte);
              this.sendBotMessage(carte.nom + ' est remise dans le deck');
              this.partieService.melangerDeck(joueur.deck);
            } else if (this.carteService.isCauchemard(carte)) {
              this.partieService.jouerCarteSurTerrain(adversaire, carte);
              this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse');
            } else {
              this.partieService.jouerCarteDansDefausse(joueur, carte);
            }
            joueur.terrain.splice(indexCarte, 1);
          }

          if (adversaire.terrain.filter(c => !c.bouclier).length > 0) {
            let carteSelectionneeSub = this.secondeCarteSelectionnee$.subscribe(
              (selectedCarte: ICarte) => {
                if (selectedCarte != null) {
                  this.sendBotMessage(joueur.nom + ' détruit la carte ' + selectedCarte.nom);
                  const indexCarte = adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

                  const carte = adversaire.terrain[indexCarte];

                  if (this.carteService.isFidelite(carte)) {
                    this.partieService.mettreCarteDansDeck(adversaire, carte);
                    this.sendBotMessage(carte.nom + ' est remise dans le deck');
                    this.partieService.melangerDeck(adversaire.deck);
                  } else if (this.carteService.isCauchemard(carte)) {
                    this.partieService.jouerCarteSurTerrain(joueur, carte);
                    this.sendBotMessage(carte.nom + ' est envoyée sur le terrain');
                  } else {
                    this.partieService.jouerCarteDansDefausse(adversaire, carte);
                  }

                  adversaire.terrain.splice(indexCarte, 1);
                }
                this.updateEffetsContinusAndScores();
              },
              (error: any) => console.error(error)
            );

            this.popupService.showSelectionCarteDialog(adversaire.terrain.filter(c => !c.bouclier));

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

      this.popupService.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible));

      this.carteSelectionnee$.subscribe(selectedCarte => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleVoixEffect(joueur: IPlayerState) {
    if (joueur.terrain.filter(c => c.silence).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.joueur.terrain[indexCarte].silence = false;
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.popupService.showSelectionCarteDialog(joueur.terrain.filter(c => c.silence));

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleTrahisonEffect(joueur: IPlayerState, adversaire: IPlayerState, partieId: number) {
    if (joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          this.carteEffetService.trahisonCarte(selectedCarte, joueur, adversaire, partieId);
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.popupService.showSelectionCarteDialog(joueur.terrain.filter(c => !c.insensible));

      this.carteSelectionnee$.subscribe(selectedCarte => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handlePrisonEffect(joueur: IPlayerState, adversaire: IPlayerState) {
    if (adversaire.terrain.filter(c => !c.bouclier && !c.prison).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            adversaire.terrain[indexCarte].prison = true;
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.popupService.showSelectionCarteDialog(adversaire.terrain.filter(c => !c.bouclier && !c.prison));

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleConversionEffect(carte: ICarte) {
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

      this.popupService.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible));

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortEffect(carte: ICarte, joueur: IPlayerState) {
    if (joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
      this.handleRenfortSelection(carte, joueur);
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortSelection(carte: ICarte, joueur: IPlayerState) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: ICarte) => {
        if (selectedCarte != null) {
          this.sendBotMessage(joueur.nom + ' cible la carte ' + selectedCarte.nom);
          const indexCarte = joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.jouerNouvelleCarte(joueur.main[indexCarte]);
        }
        this.updateEffetsContinusAndScores();
      },
      (error: any) => console.error(error)
    );

    this.popupService.showSelectionCarteDialog(joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)));

    this.carteSelectionnee$.subscribe(() => {
      carteSelectionneeSub.unsubscribe();
    });
  }

  private handleImposteurEffect(carte: ICarte) {
    if (this.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.carteService.memeTypeOuClan(c, carte)).length > 0) {
      this.handleImposteurSelection(carte);
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleImposteurSelection(carte: ICarte) {
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

    this.popupService.showSelectionCarteDialog(this.joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.carteService.memeTypeOuClan(c, carte)));

    this.carteSelectionnee$.subscribe(() => {
      carteSelectionneeSub.unsubscribe();
    });
  }

  private handleTargetSelectionEffect(carte: ICarte, effetCode: EffetEnum) {
    let targetTerrain: ICarte[] = [];

    let applyEffect: (selectedCarte: ICarte) => void;

    switch (effetCode) {
      case EffetEnum.SABOTAGE:
      case EffetEnum.KAMIKAZE:
        targetTerrain = this.adversaire.terrain.filter((c: ICarte) => !c.bouclier && !c.prison);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.adversaire.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.adversaire.terrain[indexCarte].diffPuissanceInstant -= carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.SERVIABLE:
        targetTerrain = this.joueur.terrain.filter((c: ICarte) => !c.insensible && !c.prison && this.carteService.memeTypeOuClan(c, carte));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.joueur.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.joueur.terrain[indexCarte].diffPuissanceInstant += carte.effet.valeurBonusMalus;
        };
        break;
      case EffetEnum.BOUCLIER:
        targetTerrain = this.joueur.terrain.filter((c: ICarte) => !c.insensible && !c.bouclier);
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.joueur.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.joueur.terrain[indexCarte].bouclier = true;
        };
        break;
      case EffetEnum.RECYCLAGE:
        targetTerrain = this.joueur.defausse;
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.joueur.defausse.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.mettreCarteEnDeckEnMainDepuisDefausse(this.joueur.defausse[indexCarte]);
        };
        break;
      case EffetEnum.CORRUPTION:
        targetTerrain = this.adversaire.terrain.filter((c: ICarte) => !c.bouclier && !(c.clan.nom === this.carteService.getNomCorrompu()));
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.adversaire.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.adversaire.terrain[indexCarte].clan = this.partieService.getClanCorrompu();
          this.adversaire.terrain[indexCarte].type = this.partieService.getTypeCorrompu();
        };
        break;
      case EffetEnum.POSSESSION:
        targetTerrain = this.adversaire.terrain.filter((c: ICarte) => {
          return this.carteService.getPuissanceTotale(c) <= carte.effet.conditionPuissanceAdverse &&
            !c.bouclier && (c.clan.nom === this.carteService.getNomCorrompu());
        });
        applyEffect = (selectedCarte: ICarte) => {
          const indexCarte = this.adversaire.terrain.findIndex((carteCheck: ICarte) => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.partieService.jouerCarteSurTerrain(this.joueur, this.adversaire.terrain[indexCarte]);
          this.adversaire.terrain.splice(indexCarte, 1);
        };
        break;
    }

    if (targetTerrain.length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(`${this.joueur.nom} cible la carte ${selectedCarte.nom}`);
            applyEffect(selectedCarte);
          }
          this.updateEffetsContinusAndScores();
        },
        (error: any) => console.error(error)
      );

      this.popupService.showSelectionCarteDialog(targetTerrain);

      this.carteSelectionnee$.subscribe(() => {
        carteSelectionneeSub.unsubscribe();
      });
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private updateEffetsContinusAndScores() {
    this.carteEffetService.resetBoucliersEtPuissances(this.joueur);
    this.carteEffetService.resetBoucliersEtPuissances(this.adversaire);

    this.carteEffetService.appliquerEffetsContinus(this.joueur, this.adversaire);
    this.carteEffetService.appliquerEffetsContinus(this.adversaire, this.joueur);

    this.partieService.updateScores(this.joueur, this.adversaire);
  }

  private async handleResurrectionEffect(carte: ICarte) {
    if (!this.joueurService.hasCrypte(this.adversaire)) {
      if (this.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
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

        this.popupService.showSelectionCarteDialog(this.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte)));

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

  voirDefausse(defausse: ICarte[]) {
    this.popupService.showVisionCartesDialog(defausse);
  }

  terminerPartie(): void {
    this.partieService.updateScores(this.joueur, this.adversaire);
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
      next: (evenementsPartie: IEvenementPartie[]) => {
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

  ngOnDestroy() {
    if (this.evenementsPartieSubscription) {
      this.evenementsPartieSubscription.unsubscribe();
    }

    this.sseService.closeEvenementsPartieEventSource();
  }
}
