import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {IDeck} from "../interfaces/IDeck";
import {HttpClient} from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";
import {IUtilisateur} from "../interfaces/IUtilisateur";
import {SseService} from "../services/sse.service";
import {IDemandeCombat} from "../interfaces/IDemandeCombat";
import {DialogService} from "primeng/dynamicdialog";
import {DemandeCombatDialogComponent} from "../demande-combat-dialog/demande-combat-dialog.component";
import { NgZone } from '@angular/core';
import {Subscription} from "rxjs";
import {DemandeCombatStatusEnum} from "../interfaces/DemandeCombatStatusEnum";
import {DeckService} from "../services/deck.service";
import { Router } from '@angular/router';
import {IPartie} from "../interfaces/IPartie";
import {IFormat} from "../interfaces/IFormat";

@Component({
  selector: 'app-recherche-combat',
  templateUrl: './recherche-combat.component.html',
  styleUrls: ['./recherche-combat.component.css', '../app.component.css']
})
export class RechercheCombatComponent implements OnInit, OnDestroy {
  opponentList: IUtilisateur[] = [];
  demandesCombats: IDemandeCombat[] = [];
  searching = false;
  userId = 0;
  // @ts-ignore
  private usersToFightSubscription: Subscription;
  // @ts-ignore
  private demandesDeCombatSubscription: Subscription;
  // @ts-ignore
  selectedDeck: IDeck;
  // @ts-ignore
  allDecks: IDeck[] = [];
  filteredDecks: IDeck[] = [];
  // @ts-ignore
  selectedFormat: IFormat;
  // @ts-ignore
  formats: IFormat[] = [];
  tableauDemandesRecues: IDemandeCombat[] = [];
  tableauDemandesEnvoyees: IDemandeCombat[] = [];
  chooseFirstPlayer: boolean = false;
  firstPlayerChoices = ['Vous', 'Votre adversaire'];
  // @ts-ignore
  selectedFirstPlayer: string = 'Vous';

  constructor(private http: HttpClient, private authService: AuthentificationService, private cd: ChangeDetectorRef,
              private sseService: SseService, private dialogService: DialogService, private zone: NgZone,
              private deckService: DeckService, private router: Router) {
    // @ts-ignore
    this.userId = authService.getUserId();
  }

  ngOnInit() {
    if (this.authService.isLoggedIn$) {
      this.checkSiDejaPartieEncours();
      this.getUsersSearchingFight();
      this.subscribeToUserStream();
      this.subscribeToDemandeCombatFlux()
      this.getAllFormats();
      this.chooseFirstPlayer = false;

      this.searching = true;
      this.startSearch();

      this.tableauDemandesEnvoyees = [];
      this.tableauDemandesRecues = [];

      this.deckService.getAllPlayerDecks().subscribe(playerDecks => {
        this.allDecks = playerDecks;
      });
    } else {
      this.router.navigate(['/accueil']);
    }
  }

  onToggleChange(isChecked: boolean) {
    if (isChecked) {
      this.startSearch();
    } else {
      this.stopSearch();
    }
  }

  startSearch() {
    this.http.post<number>('https://pampacardsback-57cce2502b80.herokuapp.com/api/addUserToFight', this.authService.getUserId()).subscribe(data => {
    })

    this.searching = true;
  }

  stopSearch() {
    this.http.post<number>('https://pampacardsback-57cce2502b80.herokuapp.com/api/removeUserToFight', this.authService.getUserId()).subscribe(data => {
    })

    this.searching = false;
  }

  getUsersSearchingFight() {
    this.http.get<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/usersToFight').subscribe({
      next: data => {
        this.opponentList = data;
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  updateDemandeCombat(demandeCombat: IDemandeCombat) {
    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/updateDemandeCombat', demandeCombat).subscribe({
      next: () => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  challengeOpponent(opponent: IUtilisateur) {

    let firstPlayerId;

    if (this.chooseFirstPlayer && this.selectedFirstPlayer && this.selectedFirstPlayer == "Vous") {
      firstPlayerId = this.userId;
    } else if (this.chooseFirstPlayer && this.selectedFirstPlayer && this.selectedFirstPlayer == "Votre adversaire") {
      firstPlayerId = opponent.id;
    }

    const data = {
      joueurUnId: this.userId,
      joueurDeuxId: opponent.id,
      deckUnId: this.selectedDeck.id,
      firstPlayerId: firstPlayerId,
      message: 'message'
    };
    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/createChallenge', data).subscribe({
      next: response => {
        alert('Demande de combat envoyée');
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la demande de combat');
      }
    });
  }

  private subscribeToUserStream() {
    this.sseService.getRechercheAdversairesFlux();
    this.usersToFightSubscription = this.sseService.usersToFight$.subscribe(
      (utilisateurs: IUtilisateur[]) => {
        this.opponentList = utilisateurs;
        this.cd.detectChanges();
      },
      (error: any) => console.error(error)
    );
  }

  private subscribeToDemandeCombatFlux() {
    this.sseService.getDemandeCombatFlux();
    this.demandesDeCombatSubscription = this.sseService.demandesDeCombat$.subscribe(
      (demandes: IDemandeCombat[]) => {
        this.demandesCombats = [];
        this.tableauDemandesEnvoyees = [];
        this.tableauDemandesRecues = [];
        for (let demande of demandes) {
          if (demande.joueurUnId == this.userId) {
            this.tableauDemandesEnvoyees.push(demande);
          } else if (demande.joueurDeuxId == this.userId && demande.status != DemandeCombatStatusEnum.DEMANDE_REFUSEE) {
            this.tableauDemandesRecues.push(demande);
          }

          if (demande.joueurDeuxId == this.userId && demande.status == DemandeCombatStatusEnum.DEMANDE_ENVOYEE) {
            demande.status = DemandeCombatStatusEnum.DEMANDE_RECUE;
            this.updateDemandeCombat(demande);
            this.demandesCombats.push(demande);
          }

          if (demande.joueurUnId == this.userId && demande.status == DemandeCombatStatusEnum.PARTIE_CREEE) {
            demande.status = DemandeCombatStatusEnum.DEMANDE_CLOSE;
            this.deleteDemandeCombat(demande);
            alert('Demande de combat acceptée par ' + demande.joueurDeuxPseudo);
            this.router.navigate(['/partie', demande.partieId]);
          }
        }
      },
      (error: any) => console.error(error)
    );
  }

  showDialog(demande: IDemandeCombat, decks: IDeck[]) {
    this.zone.run(() => {
      const ref = this.dialogService.open(DemandeCombatDialogComponent, {
        header: demande.joueurUnPseudo + ' vous propose un combat !',
        width: '30%',
        height: '50vh',
        data: { demande : demande, decks: decks },
        closable: false
      });

      ref.onClose.subscribe((demandeCombat: IDemandeCombat) => {
        this.demandesCombats.push(demandeCombat);
        if (demandeCombat.status === DemandeCombatStatusEnum.DEMANDE_ACCEPTEE) {
          this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/createPartie', demandeCombat).subscribe({
            next: response => {
              demandeCombat.partieId = response;
              demandeCombat.status = DemandeCombatStatusEnum.PARTIE_CREEE;
              this.updateDemandeCombat(demandeCombat);
              this.router.navigate(['/partie', response]);
            },
            error: error => {
              console.error('There was an error!', error);
            }
          });
        } else {
          this.updateDemandeCombat(demandeCombat);
        }
      });
    });
  }

  deleteDemandeCombat(demandeCombat: IDemandeCombat) {
    let index = this.tableauDemandesEnvoyees.findIndex(d => d.id === demandeCombat.id);
    if (index !== -1) {
      this.tableauDemandesEnvoyees.splice(index, 1);
    }
    index = this.tableauDemandesRecues.findIndex(d => d.id === demandeCombat.id);
    if (index !== -1) {
      this.tableauDemandesRecues.splice(index, 1);
    }
    this.cd.detectChanges();

    this.http.request('delete', 'https://pampacardsback-57cce2502b80.herokuapp.com/api/demandeCombat', {body: demandeCombat}).subscribe({
      next: () => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private checkSiDejaPartieEncours() {
    this.http.get<IPartie>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEnCours?utilisateurId=' + this.userId).subscribe({
      next: partie => {
        if (partie && partie.id != null) {
          this.router.navigate(['/partie', partie.id]);
        }
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private getAllFormats() {
    this.http.get<IFormat[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/formats').subscribe({
      next: data => {
        data.forEach(format => this.formats.push(format));
      },
      error: error => {
        console.error('There was an error!', error);
      }
    })
  }

  deleteDemande(demande: IDemandeCombat) {
    this.deleteDemandeCombat(demande);
  }

  voirDemande(demande: IDemandeCombat) {
    this.showDialog(demande, this.allDecks);
    this.cd.detectChanges();
  }

  refuserDemande(demande: IDemandeCombat) {
    demande.status = DemandeCombatStatusEnum.DEMANDE_REFUSEE;
    let index = this.demandesCombats.findIndex(d => d.id === demande.id);
    if (index !== -1) {
      this.demandesCombats.splice(index, 1);
    }
    index = this.demandesCombats.findIndex(d => d.id === demande.id);
    if (index !== -1) {
      this.demandesCombats.splice(index, 1);
    }
    this.cd.detectChanges();
    this.updateDemandeCombat(demande);
  }

  onFormatChange() {
    this.filteredDecks = this.allDecks.filter(deck => deck.format.formatId == this.selectedFormat.formatId);
  }

  getStatusLabel(status: string) {
    switch (status) {
      case DemandeCombatStatusEnum.DEMANDE_RECUE: {
        return 'Reçue';
      }
      case DemandeCombatStatusEnum.DEMANDE_ACCEPTEE: {
        return 'Acceptée';
      }
      case DemandeCombatStatusEnum.PARTIE_CREEE: {
        return 'Créée';
      }
      case DemandeCombatStatusEnum.DEMANDE_REFUSEE: {
        return 'Refusée';
      }
      case DemandeCombatStatusEnum.DEMANDE_CLOSE: {
        return 'Close';
      }
      default:
        return '';
    }
  }

  ngOnDestroy() {
    this.searching = false;
    this.stopSearch();

    if (this.usersToFightSubscription) {
      this.usersToFightSubscription.unsubscribe();
    }
    if (this.demandesDeCombatSubscription) {
      this.demandesDeCombatSubscription.unsubscribe();
    }
    this.sseService.closeUserListEventSource();
    this.sseService.closeDemandeCombatEventSource();
  }


}
