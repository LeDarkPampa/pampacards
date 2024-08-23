import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {SseService} from "../services/sse.service";
import {Observable, of, Subscription, switchMap, throwError} from "rxjs";
import {IEvenementPartie} from "../interfaces/IEvenementPartie";
import { HttpClient } from "@angular/common/http";
import {IPartie} from "../interfaces/IPartie";
import {AuthentificationService} from "../services/authentification.service";
import {ICarte} from "../interfaces/ICarte";
import {DialogService} from "primeng/dynamicdialog";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";
import {CarteService} from "../services/carte.service";
import {PartieService} from "../services/partie.service";
import {CarteEffetService} from "../services/carteEffet.service";
import {TchatService} from "../services/tchat.service";
import {PartieEventService} from "../services/partieEvent.service";
import {IPartieDatas} from "../interfaces/IPartieDatas";
import {CustomDialogService} from "../services/customDialog.service";
import {TournoiService} from "../services/tournoi.service";
import {ITournoi} from "../interfaces/ITournoi";
import {ILigue} from "../interfaces/ILigue";
import {catchError, map} from "rxjs/operators";

@Component({
  selector: 'app-partie',
  templateUrl: './partie.component.html',
  styleUrls: ['./partie.component.css', '../app.component.css']
})
export class PartieComponent implements OnInit, OnDestroy {

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
  estJoueurActif = signal(false);
  estPremierJoueur = signal(false);
  carteJouee = signal(false);
  carteDefaussee = signal(false);
  clickedCartePath: string = '';

  isFlashing: boolean = false;
  enAttente = signal(true);

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone, private carteService: CarteService,
              private partieService: PartieService, private router: Router,
              private partieEventService: PartieEventService, private tournoiService: TournoiService,
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

    this.estPremierJoueur.set(this.partie.joueurUn.id === this.userId);
  }

  finDeTour() {
    if (this.estJoueurActif()) {
      let event = this.partieEventService.createEndTurnEvent(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);
      this.partieEventService.sendEvent(event);
    }
  }

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {
    if (this.partieDatas.lastEvent.status === "EN_ATTENTE") {
      this.enAttente.set(true);
      return;
    }

    this.enAttente.set(false);

    if (lastEvent.status === "FIN_PARTIE" && !this.partieDatas.finDePartie) {
      this.partieDatas.finDePartie = true;
      if (this.partieDatas.joueur.id === this.partie.joueurUn.id) {
        this.terminerPartie();
      }
    }

    if (lastEvent.status === "ABANDON") {
      this.partieDatas.finDePartie = true;
    }

    this.estJoueurActif.set(lastEvent.joueurActifId === this.userId);

    const isNotTourEnCoursOrEmptyDeck = lastEvent.joueurActifId !== this.partieDatas.joueur.id
      || lastEvent.status !== "TOUR_EN_COURS"
      || (this.partieDatas.joueur.terrain.length === 0 && this.partieDatas.joueur.deck.length === 0);

    if (isNotTourEnCoursOrEmptyDeck) {
      this.partieService.updatePlayerAndOpponent(lastEvent, this.partie, this.partieDatas, this.userId);
    }

    this.carteJouee.set(lastEvent.carteJouee);
    this.carteDefaussee.set(lastEvent.carteDefaussee);

    if (lastEvent.status === "NOUVEAU_TOUR" && this.estJoueurActif()) {
      this.startNewTurn();
    }

    if (lastEvent.status === "DEBUT_PARTIE") {
      this.initCards();
    }

    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
    this.cd.detectChanges();
  }

  private startNewTurn() {
    this.carteJouee.set(false);
    this.carteDefaussee.set(false);

    this.isFlashing = true; // Activez l'animation de flash

    // On pioche jusqu'à avoir 4 cartes en main si on est le joueur actif
    while (this.partieDatas.joueur.main.length < 4 && this.partieDatas.joueur.deck.length > 0) {
      this.piocherCarte();
    }

    this.partieEventService.sendUpdatedGame(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);

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

  onDefausserCarte(index: number) {
    if (index !== -1) {
      const carteJouee = this.partieDatas.joueur.main.splice(index, 1)[0];
      this.sendBotMessage(this.partieDatas.joueur.nom + ' défausse la carte ' + carteJouee.nom);
      this.carteDefaussee.set(true);
      if (this.carteService.isFidelite(carteJouee)) {
        this.sendBotMessage(carteJouee.nom + ' est remise dans le deck');
        this.partieDatas.joueur.deck.push(carteJouee);
        this.carteEffetService.melangerDeck(this.partieDatas.joueur.deck);
      } else {
        this.partieDatas.joueur.defausse.push(carteJouee);
      }
    }
    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);
    this.cd.detectChanges();
    this.partieEventService.sendUpdatedGameAfterDefausse(this.partie, this.userId, this.partieDatas.joueur, this.partieDatas.adversaire, this.partieDatas.lastEvent);
  }

  onJouerCarte(index: number) {
    if (index !== -1) {
      this.carteJouee.set(true);
      const carte = this.partieDatas.joueur.main.splice(index, 1)[0];

      this.sendBotMessage(this.partieDatas.joueur.nom + ' joue la carte ' + carte.nom);
      this.partieService.jouerCarte(carte, this.partie, this.partieDatas, this.userId);
    }

    this.cd.detectChanges();
  }

  voirDefausse(defausse: ICarte[]) {
    this.customDialogService.showVisionCartesDialog(defausse);
  }

  terminerPartie(): void {
    this.partieService.terminerPartie(this.partie, this.partieDatas);
    this.cd.detectChanges();
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
      return this.estPremierJoueur() ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    } else if (this.estJoueurActif()) {
      return this.estPremierJoueur() ? 'terrain-joueur-premier' : 'terrain-joueur-autre';
    } else {
      return this.estPremierJoueur() ? 'terrain-joueur-premier-dark' : 'terrain-joueur-autre-dark';
    }
  }

  getAdvColorClass(): string {
    if (this.partieDatas.finDePartie) {
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

  getCompetition(id: number): Observable<{ type: string, data: ITournoi | ILigue }> {
    return this.tournoiService.getTournoi(id).pipe(
      catchError(err => {
        // Si l'erreur est une 404 (tournoi non trouvé), essayer de récupérer la ligue
        if (err.status === 404) {
          return this.tournoiService.getLigue(id).pipe(
            map(ligue => {
              if (ligue) {
                return { type: 'ligue', data: ligue };
              } else {
                throw new Error('Competition not found');
              }
            })
          );
        } else {
          // Si c'est une autre erreur, la propager
          return throwError(() => err);
        }
      }),
      map(tournoi => ({ type: 'tournoi', data: tournoi })) // Si on arrive ici, c'est un tournoi valide
    );
  }

  ngOnDestroy() {
    if (this.evenementsPartieSubscription) {
      this.evenementsPartieSubscription.unsubscribe();
    }

    this.sseService.closeEvenementsPartieEventSource();
  }
}
