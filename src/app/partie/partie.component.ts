import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../services/sse.service";
import {first, of, Subscription, tap} from "rxjs";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import {HttpClient} from "@angular/common/http";
import {IPartie} from "../interfaces/IPartie";
import {IPlayerState} from "../interfaces/IPlayerState";
import {AuthentificationService} from "../services/authentification.service";
import {EffetEnum} from "../interfaces/EffetEnum";
import {ICarte} from "../interfaces/ICarte";
import {DialogService} from "primeng/dynamicdialog";
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
  public carteSelectionnee$;
  public secondeCarteSelectionnee$;
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
    this.carteSelectionnee$ = this.popupService.carteSelectionneeSubject.asObservable();
    this.secondeCarteSelectionnee$ = this.popupService.carteSelectionneeSubject.asObservable();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.partieId = params['id'];
      this.initializePartie();
    });
  }

  private initializePartie() {
    this.getPartie();
    this.getEventsPartie();
    this.subscribeToEvenementsPartieFlux();
    this.cd.detectChanges();
  }

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {
    this.enAttente = lastEvent.status === "EN_ATTENTE";
    this.finDePartie = lastEvent.status === "FIN_PARTIE" || lastEvent.status === "ABANDON";
    this.estJoueurActif = lastEvent.joueurActifId === this.userId;

    if (this.enAttente) {
      this.cd.detectChanges();
      return;
    }

    if (this.finDePartie && !this.finDePartie && this.joueur.id === this.partie.joueurUn.id) {
      this.terminerPartie();
    }

    if (lastEvent.status === "DEBUT_PARTIE") {
      this.initCards();
    } else if (lastEvent.status === "NOUVEAU_TOUR" && this.estJoueurActif) {
      this.startNewTurn();
    }

    this.partieService.updatePlayerAndOpponent(this.partie, this.joueur, this.adversaire, lastEvent, this.userId);
    this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
    this.cd.detectChanges();
  }

  private startNewTurn() {
    this.carteJouee = false;
    this.carteDefaussee = false;
    this.isFlashing = true;

    while (this.joueur.main.length < 4 && this.joueur.deck.length > 0) {
      this.piocherCarte();
    }

    setTimeout(() => {
      this.isFlashing = false;
    }, 1000);
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
        this.playInstantEffect(carteJouee, this.joueur, this.adversaire, this.partie).then(r => {
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

          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
          this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent, stopJ1, stopJ2);
        });
      } else {
        this.partieService.jouerCarteSurTerrain(this.joueur, carteJouee);
        this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
        this.cd.detectChanges();
        this.partieEventService.sendUpdatedGameAfterPlay(this.partie, this.userId, this.joueur, this.adversaire, this.lastEvent);
      }
    }
  }

  jouerNouvelleCarte(carte: ICarte, joueur: IPlayerState, adversaire: IPlayerState, partie: IPartie, lastEvent: IEvenementPartie, userId: number) {
    const index = joueur.main.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      this.joueur.main.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        this.playInstantEffect(carte, joueur, adversaire, partie).then(r => {
          if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEUR) {
            this.partieService.jouerCarteSurTerrain(adversaire, carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
            carte.puissance = -4;
            this.partieService.jouerCarteSurTerrain(adversaire, carte);
          } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
            this.partieService.jouerCarteDansDefausse(joueur, carte);
          } else {
            this.partieService.jouerCarteSurTerrain(joueur, carte);
          }
        }
        );
      } else {
        this.partieService.jouerCarteSurTerrain(joueur, carte);
      }

      let stopJ1 = false;
      let stopJ2 = false;
      if (carte && carte.effet.code == EffetEnum.STOP) {
        if (joueur.id == partie.joueurUn.id) {
          stopJ2 = true;
        } else if (joueur.id == partie.joueurDeux.id) {
          stopJ1 = true;
        }
      }

      this.carteEffetService.updateEffetsContinusAndScores(joueur, adversaire);
      this.partieEventService.sendUpdatedGameAfterPlay(partie, userId, joueur, adversaire, lastEvent, stopJ1, stopJ2);
      this.carteEffetService.updateEffetsContinusAndScores(joueur, adversaire);
    }
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
    this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
    this.cd.detectChanges();
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
    this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
    this.cd.detectChanges();
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

  private async playInstantEffect(carte: ICarte, joueur: IPlayerState, adversaire: IPlayerState, partie: IPartie) {
    if (!carte || !carte.effet || carte.effet.code === 'NO') {
      return;
    }

    const effetHandlers: { [key: string]: () => void } = {
      [EffetEnum.HEROISME]: () => this.carteEffetService.handleHeroisme(carte, adversaire),
      [EffetEnum.AMITIE]: () => this.carteEffetService.handleAmitie(carte, joueur),
      [EffetEnum.SOUTIEN]: () => this.carteEffetService.handleSoutien(carte, joueur),
      [EffetEnum.MEUTE]: () => this.carteEffetService.handleMeute(carte, joueur),
      [EffetEnum.TARDIF]: () => this.carteEffetService.handleTardif(carte, this.getTourAffiche()),
      [EffetEnum.MATINAL]: () => this.carteEffetService.handleMatinal(carte, this.getTourAffiche()),
      [EffetEnum.IMMUNISE]: () => this.carteEffetService.addImmunise(carte),
      [EffetEnum.INSENSIBLE]: () => this.carteEffetService.addInsensible(carte),
      [EffetEnum.SACRIFICE]: () => this.carteEffetService.handleSacrifice(joueur, partie.id),
      [EffetEnum.ELECTROCUTION]: () => this.carteEffetService.handleElectrocution(adversaire, partie.id),
      [EffetEnum.RESET]: () => this.carteEffetService.handleReset(joueur),
      [EffetEnum.FUSION]: () => this.carteEffetService.handleFusion(carte, joueur, adversaire, partie),
      [EffetEnum.SABOTAGE]: () => this.handleTargetSelectionEffect(carte, EffetEnum.SABOTAGE),
      [EffetEnum.KAMIKAZE]: () => this.handleTargetSelectionEffect(carte, EffetEnum.KAMIKAZE),
      [EffetEnum.SERVIABLE]: () => this.handleTargetSelectionEffect(carte, EffetEnum.SERVIABLE),
      [EffetEnum.BOUCLIER]: () => this.handleTargetSelectionEffect(carte, EffetEnum.BOUCLIER),
      [EffetEnum.RECYCLAGE]: () => this.handleTargetSelectionEffect(carte, EffetEnum.RECYCLAGE),
      [EffetEnum.CORRUPTION]: () => this.handleTargetSelectionEffect(carte, EffetEnum.CORRUPTION),
      [EffetEnum.POSSESSION]: () => this.handleTargetSelectionEffect(carte, EffetEnum.POSSESSION),
      [EffetEnum.SILENCE]: () => this.carteEffetService.handleSilenceEffect(joueur, adversaire, partie.id),
      [EffetEnum.SAUVETAGE]: () => this.carteEffetService.handleSauvetageEffect(joueur, adversaire, partie.id),
      [EffetEnum.TROC]: () => this.handleTroc(),
      [EffetEnum.CASSEMURAILLE]: () => this.handleCasseMurailleEffect(),
      [EffetEnum.RESURRECTION]: async () => await this.handleResurrectionEffect(carte),
      [EffetEnum.RENFORT]: () => this.handleRenfortEffect(carte),
      [EffetEnum.IMPOSTEUR]: () => this.handleImposteurEffect(carte, joueur, partie.id),
      [EffetEnum.CONVERSION]: () => this.handleConversionEffect(carte),
      [EffetEnum.PRISON]: () => this.handlePrisonEffect(),
      [EffetEnum.VISION]: () => this.carteEffetService.handleVisionEffect(joueur),
      [EffetEnum.ESPION]: () => this.carteEffetService.handleEspionEffect(joueur, adversaire),
      [EffetEnum.MENTALISME]: () => this.carteEffetService.handleMentalisme(adversaire),
      [EffetEnum.TRAHISON]: () => this.handleTrahisonEffect(),
      [EffetEnum.SECOND]: () => this.carteEffetService.handleSecond(carte, this.getTourAffiche()),
      [EffetEnum.TROISIEME]: () => this.carteEffetService.handleTroisieme(carte, this.getTourAffiche()),
      [EffetEnum.DEVOREUR]: () => this.carteEffetService.handleDevoreur(carte, joueur, adversaire),
      [EffetEnum.TERREUR]: () => this.carteEffetService.handleTerror(carte, adversaire),
      [EffetEnum.ENTERREMENT]: () => this.carteEffetService.handleEnterrement(adversaire, partie.id),
      [EffetEnum.DUOTERREMENT]: () => this.carteEffetService.handleDuoterrementEffect(adversaire, partie.id),
      [EffetEnum.NUEE]: () => this.carteEffetService.handleNuee(joueur, carte),
      [EffetEnum.POISSON]: () => this.carteEffetService.handlePoisson(adversaire, carte),
      [EffetEnum.PARI]: () => this.carteEffetService.handlePariEffect(joueur, carte),
      [EffetEnum.ABSORPTION]: () => this.carteEffetService.handleAbsorption(joueur, adversaire),
      [EffetEnum.VOIX]: () => this.handleVoixEffect(),
      [EffetEnum.MEURTRE]: () => this.handleMeurtreEffect(),
      [EffetEnum.CHROPIE]: () => this.handleChropieEffect(carte),
      [EffetEnum.RESISTANCE_INSTANT]: () => this.carteEffetService.handleResistanceInstant(carte, joueur),
      [EffetEnum.SEPT]: () => this.carteEffetService.handleSeptEffect(carte, joueur, adversaire),
      [EffetEnum.SIX]: () => this.carteEffetService.handleSixEffect(joueur, adversaire, carte),
      [EffetEnum.CINQ]: () => this.carteEffetService.handleCinqEffect(joueur, adversaire, carte),
      [EffetEnum.QUATRE]: () => this.carteEffetService.handleQuatreEffect(joueur, adversaire, carte, partie.id),
      [EffetEnum.BOUCLIERPLUS]: () => this.carteEffetService.addBouclierPlus(carte),
      [EffetEnum.INSENSIBLEPLUS]: () => this.carteEffetService.addInsensiblePlus(carte),
      [EffetEnum.SECTE]: () => this.carteEffetService.handleSecteEffect(carte, adversaire),
      [EffetEnum.CRUAUTE]: () => this.carteEffetService.handleCruauteEffect(carte, adversaire),
      [EffetEnum.HERITAGE]: () => this.carteEffetService.handleHeritageEffect(carte, joueur),
      [EffetEnum.EGOISME]: () => this.carteEffetService.handleEgoismeEffect(carte, joueur),
      default: () => { /* Cas par défaut si aucun effet ne correspond */ }
    };
    const handler = effetHandlers[carte.effet.code];
    if (handler) {
      await handler();
    }
    this.cd.detectChanges();
  }

  jouerNouvelleCarteDepuisDefausse(carte: ICarte, joueur: IPlayerState, adversaire: IPlayerState) {
    const index = joueur.defausse.findIndex(c => c.id === carte.id);
    if (index !== -1) {
      joueur.defausse.splice(index, 1)[0];
      if (carte.effet.code != 'NO' && !carte.effet.continu) {
        if (carte.effet.code && carte.effet.code === EffetEnum.SURVIVANT) {
          carte.diffPuissanceInstant += 2;
        }

        this.playInstantEffect(carte, this.joueur, this.adversaire, this.partie).then(r => {
            // @ts-ignore
            if (carte.effet.code == EffetEnum.SABOTEUR) {
              this.partieService.jouerCarteSurTerrain(adversaire, carte);
            } else if (carte.effet && carte.effet.code == EffetEnum.SABOTEURPLUS) {
              carte.puissance = -4;
              this.partieService.jouerCarteSurTerrain(adversaire, carte);
            } else if (carte && carte.effet && carte.effet.code == EffetEnum.KAMIKAZE) {
              this.partieService.jouerCarteDansDefausse(joueur, carte);
            } else {
              this.partieService.jouerCarteSurTerrain(joueur, carte);
            }
          }
        );
      } else {
        this.partieService.jouerCarteSurTerrain(joueur, carte);
      }
    }

    this.carteEffetService.updateEffetsContinusAndScores(joueur, adversaire);
  }

  private handleTroc() {
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
          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
        }),
        catchError(error => {
          console.error(error);
          return of(null);
        })
      )
      .subscribe();
  }

  private handleCasseMurailleEffect() {
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
            this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
            this.cd.detectChanges();
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
            this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
            this.cd.detectChanges();
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
  }

  private handleChropieEffect(carte: ICarte) {
    const cartesAvecEffet = this.adversaire.defausse.filter(c => c.effet);
    if (cartesAvecEffet.length > 0) {
      this.handleSelection(carte, () => true, selectedCarte => {
        const indexCarteSelectionnee = this.adversaire.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
        carte.effet = this.adversaire.defausse[indexCarteSelectionnee].effet;
        this.playInstantEffect(carte, this.joueur, this.adversaire, this.partie).then(() => this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire));
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
          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
        }
        carteSelectionneeSub.unsubscribe();
      },
      (error: any) => console.error(error)
    );

    this.popupService.showSelectionCarteDialog(this.joueur.terrain.filter(filterCondition));
  }

  private handleMeurtreEffect() {
    if (this.joueur.terrain.filter(c => !c.insensible).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' détruit la carte ' + selectedCarte.nom);
            const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));

            const carte = this.joueur.terrain[indexCarte];

            if (this.carteService.isFidelite(carte)) {
              this.partieService.mettreCarteDansDeck(this.joueur, carte);
              this.sendBotMessage(carte.nom + ' est remise dans le deck');
              this.partieService.melangerDeck(this.joueur.deck);
            } else if (this.carteService.isCauchemard(carte)) {
              this.partieService.jouerCarteSurTerrain(this.adversaire, carte);
              this.sendBotMessage(carte.nom + ' est envoyée sur le terrain adverse');
            } else {
              this.partieService.jouerCarteDansDefausse(this.joueur, carte);
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

                  if (this.carteService.isFidelite(carte)) {
                    this.partieService.mettreCarteDansDeck(this.adversaire, carte);
                    this.sendBotMessage(carte.nom + ' est remise dans le deck');
                    this.partieService.melangerDeck(this.adversaire.deck);
                  } else if (this.carteService.isCauchemard(carte)) {
                    this.partieService.jouerCarteSurTerrain(this.joueur, carte);
                    this.sendBotMessage(carte.nom + ' est envoyée sur le terrain');
                  } else {
                    this.partieService.jouerCarteDansDefausse(this.adversaire, carte);
                  }

                  this.adversaire.terrain.splice(indexCarte, 1);
                }
                this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
                this.cd.detectChanges();
              },
              (error: any) => console.error(error)
            );

            this.popupService.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier));

            this.secondeCarteSelectionnee$.subscribe(selectedCarte => {
              carteSelectionneeSub.unsubscribe();
            });
          } else {
            this.sendBotMessage('Pas de cible disponible pour le pouvoir');
          }

          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
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

  private handleVoixEffect() {
    if (this.joueur.terrain.filter(c => c.silence).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.joueur.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.joueur.terrain[indexCarte].silence = false;
          }
          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
        },
        (error: any) => console.error(error)
      );

      this.popupService.showSelectionCarteDialog(this.joueur.terrain.filter(c => c.silence));

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
        (selectedCarte: ICarte) => {
          this.carteEffetService.trahisonCarte(selectedCarte, this.joueur, this.adversaire, this.partieId);
          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
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

  private handlePrisonEffect() {
    if (this.adversaire.terrain.filter(c => !c.bouclier && !c.prison).length > 0) {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          if (selectedCarte != null) {
            this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
            const indexCarte = this.adversaire.terrain.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
            this.adversaire.terrain[indexCarte].prison = true;
          }
          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
        },
        (error: any) => console.error(error)
      );

      this.popupService.showSelectionCarteDialog(this.adversaire.terrain.filter(c => !c.bouclier && !c.prison));

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
          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
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

  private handleRenfortEffect(carte: ICarte) {
    if (this.joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
      this.handleRenfortSelection(carte);
    } else {
      this.sendBotMessage('Pas de cible disponible pour le pouvoir');
    }
  }

  private handleRenfortSelection(carte: ICarte) {
    let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
      (selectedCarte: ICarte) => {
        if (selectedCarte != null) {
          this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
          const indexCarte = this.joueur.main.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
          this.jouerNouvelleCarte(this.joueur.main[indexCarte], this.joueur, this.adversaire, this.partie, this.lastEvent, this.userId);
          this.cd.detectChanges();
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
        this.cd.detectChanges();
      },
      (error: any) => console.error(error)
    );

    this.popupService.showSelectionCarteDialog(this.joueur.main.filter(c => this.carteService.memeTypeOuClan(c, carte)));

    this.carteSelectionnee$.subscribe(() => {
      carteSelectionneeSub.unsubscribe();
    });
  }

  private handleImposteurEffect(carte: ICarte, joueur: IPlayerState, partieId: number) {
    if (joueur.terrain.filter(c => !c.insensible && !c.silence && c.effet && this.carteService.memeTypeOuClan(c, carte)).length > 0) {
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

          this.playInstantEffect(carte, this.joueur, this.adversaire, this.partie).then(r => {
            this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
            this.cd.detectChanges();
          });
        }
        this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
        this.cd.detectChanges();
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
          this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
          this.cd.detectChanges();
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

  private async handleResurrectionEffect(carte: ICarte) {
    if (!this.joueurService.hasCrypte(this.adversaire)) {
      if (this.joueur.defausse.filter(c => this.carteService.memeTypeOuClan(c, carte)).length > 0) {
        let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
          (selectedCarte: ICarte) => {
            if (selectedCarte != null) {
              this.sendBotMessage(this.joueur.nom + ' cible la carte ' + selectedCarte.nom);
              const indexCarte = this.joueur.defausse.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
              this.jouerNouvelleCarteDepuisDefausse(this.joueur.defausse[indexCarte], this.joueur, this.adversaire);
              this.cd.detectChanges();
            }
            this.carteEffetService.updateEffetsContinusAndScores(this.joueur, this.adversaire);
            this.cd.detectChanges();
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
    this.cd.detectChanges();
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

    this.partieEventService.sendResultatFinal(this.partie, this.joueur, this.adversaire, vainqueurId);
  }

  private getPartie() {
    this.partieEventService.getPartie(this.partieId).subscribe({
      next: (partie: IPartie) => {
        this.partie = partie;
        this.partieService.initValues(this.partie, this.joueur, this.adversaire, this.userId);
        this.estPremierJoueur = this.partie.joueurUn.id === this.userId;
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
