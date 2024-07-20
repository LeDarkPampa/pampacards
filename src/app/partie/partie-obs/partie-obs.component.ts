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
import {IPartieDatas} from "../../interfaces/IPartieDatas";
import {CarteEffetService} from "../../services/carteEffet.service";
import {PartieService} from "../../services/partie.service";

@Component({
  selector: 'app-partie-obs',
  templateUrl: './partie-obs.component.html',
  styleUrls: ['./partie-obs.component.css', '../../app.component.css']
})
export class PartieObsComponent  implements OnInit, OnDestroy {
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

  // @ts-ignore
  typeEcran: string;
  // @ts-ignore
  private firstEvent: IEvenementPartie;
  // @ts-ignore
  actuaLEvent: IEvenementPartie;
  listEvents: IEvenementPartie[] = [];

  chatMessages: IChatPartieMessage[] = [];
  message: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone, private carteEffetService: CarteEffetService,
              private sseService: SseService, private cd: ChangeDetectorRef,private  partieService: PartieService) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.partieId = params['id'];
      this.typeEcran = params['type'];
      this.partieDatas.partieId = this.partieId;
      this.getPartie();
      this.getEventsPartie();
      this.subscribeToEvenementsPartieFlux();
      this.cd.detectChanges();
    });
  }

  private updateGameFromLastEvent(lastEvent: IEvenementPartie) {
    this.partieDatas.joueur.id = this.partie.joueurUn.id;
    this.partieDatas.adversaire.id = this.partie.joueurDeux.id;

    this.partieDatas.joueur.deck = lastEvent.cartesDeckJoueurUn && lastEvent.cartesDeckJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesDeckJoueurUn) : [];
    this.partieDatas.adversaire.deck = lastEvent.cartesDeckJoueurDeux && lastEvent.cartesDeckJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesDeckJoueurDeux) : [];

    this.partieDatas.joueur.main = lastEvent.cartesMainJoueurUn && lastEvent.cartesMainJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesMainJoueurUn) : [];
    this.partieDatas.adversaire.main = lastEvent.cartesMainJoueurDeux && lastEvent.cartesMainJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesMainJoueurDeux) : [];

    this.partieDatas.joueur.terrain = lastEvent.cartesTerrainJoueurUn && lastEvent.cartesTerrainJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesTerrainJoueurUn) : [];
    this.partieDatas.adversaire.terrain = lastEvent.cartesTerrainJoueurDeux && lastEvent.cartesTerrainJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesTerrainJoueurDeux) : [];

    this.partieDatas.joueur.defausse = lastEvent.cartesDefausseJoueurUn && lastEvent.cartesDefausseJoueurUn.length > 0 ? JSON.parse(lastEvent.cartesDefausseJoueurUn) : [];
    this.partieDatas.adversaire.defausse = lastEvent.cartesDefausseJoueurDeux && lastEvent.cartesDefausseJoueurDeux.length > 0 ? JSON.parse(lastEvent.cartesDefausseJoueurDeux) : [];

    if (lastEvent.status == "DEBUT_PARTIE") {
      this.initCards();
    }
    this.carteEffetService.updateEffetsContinusAndScores(this.partieDatas);

    this.cd.detectChanges();
  }

  private initCards() {
    this.partieService.initPlayerCards(this.partieDatas.joueur);
    this.partieService.initPlayerCards(this.partieDatas.adversaire);
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

  voirDefausse(defausse: ICarte[]) {
    this.showVisionCartesDialog(defausse);
  }

  private getPartie() {
    this.http.get<IPartie>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partie?partieId=' + this.partieId).subscribe({
      next: partie => {
        this.partie = partie;
        this.initValues();
        this.getEventsPartie();

        if (this.typeEcran === 'obs') {
          this.subscribeToEvenementsPartieFlux();
        }
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
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

  getTourAffiche() {
    return Math.ceil((this.partieDatas.lastEvent ? this.partieDatas.lastEvent.tour : 0) / 2);
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

  private getEventsPartie() {
    this.http.get<IEvenementPartie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEvents?partieId=' + this.partieId).subscribe({
      next: evenementsPartie => {

        if (this.typeEcran === 'obs') {
          // @ts-ignore
          this.partieDatas.lastEvent = evenementsPartie.at(-1);
          if (this.partieDatas.lastEvent && this.partieDatas.lastEvent.id > this.lastEventId) {
            this.lastEventId = this.partieDatas.lastEvent.id;
            this.updateGameFromLastEvent(this.partieDatas.lastEvent);
          }
        } else if (this.typeEcran === 'replay') {
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
