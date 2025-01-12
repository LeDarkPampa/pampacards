import {ChangeDetectorRef, Component, OnDestroy, OnInit, signal} from '@angular/core';
import {Deck} from "../classes/decks/Deck";
import { HttpClient } from "@angular/common/http";
import {AuthentificationService} from "../services/authentification.service";
import {Utilisateur} from "../classes/Utilisateur";
import {SseService} from "../services/sse.service";
import {DialogService} from "primeng/dynamicdialog";
import {DemandeCombatDialogComponent} from "../demande-combat-dialog/demande-combat-dialog.component";
import { NgZone } from '@angular/core';
import {Subscription} from "rxjs";
import {DemandeCombatStatusEnum} from "../enums/DemandeCombatStatusEnum";
import { Router } from '@angular/router';
import {Partie} from "../classes/parties/Partie";
import {Format} from "../classes/decks/Format";
import {DemandeCombatService} from "../services/demandeCombat.service";
import {ReferentielService} from "../services/referentiel.service";
import {UtilisateurService} from "../services/utilisateur.service";
import {DemandeCombat} from "../classes/combats/DemandeCombat";

@Component({
  selector: 'app-recherche-combat',
  templateUrl: './recherche-combat.component.html',
  styleUrls: ['./recherche-combat.component.css', '../app.component.css']
})
export class RechercheCombatComponent implements OnInit, OnDestroy {
  opponentList = signal<Utilisateur[]>([]);
  demandesCombats = signal<DemandeCombat[]>([]);
  searching = false;
  userId: number = 0;
  usersToFightSubscription?: Subscription;
  demandesDeCombatSubscription?: Subscription;
  selectedDeckBot?: Deck;
  selectedDeck?: Deck;
  allDecks: Deck[] = [];
  filteredDecks: Deck[] = [];
  selectedFormat?: Format;
  formats: Format[] = [];
  tableauDemandesRecues: DemandeCombat[] = [];
  tableauDemandesEnvoyees: DemandeCombat[] = [];
  botList: Utilisateur[] = [];
  selectedBot?: Utilisateur;
  chooseFirstPlayer: boolean = false;
  firstPlayerChoices = ['Vous', 'Votre adversaire'];
  selectedFirstPlayer: string = 'Vous';

  constructor(private http: HttpClient, private combatService: DemandeCombatService,
              private referentielService: ReferentielService,
              private authService: AuthentificationService, private cd: ChangeDetectorRef,
              private sseService: SseService, private dialogService: DialogService, private zone: NgZone,
              private utilisateurService: UtilisateurService, private router: Router) {
    this.userId = authService.getUserId();
  }

  ngOnInit() {
    this.getBots();
    this.checkSiDejaPartieEncours();
    this.getUsersSearchingFight();
    this.subscribeToUserStream();
    this.subscribeToDemandeCombatFlux();

    this.referentielService.getAllFormats().subscribe(
      (formats: Format[]) => {
        this.formats = formats;
      },
      (error) => {
        console.error('Erreur lors de la récupération des types', error);
      }
    );
    this.chooseFirstPlayer = false;

    this.searching = true;
    this.startSearch();

    this.tableauDemandesEnvoyees = [];
    this.tableauDemandesRecues = [];

    this.utilisateurService.getAllDecks().subscribe(playerDecks => {
      this.allDecks = playerDecks;
    });
  }

  onToggleChange(isChecked: boolean) {
    if (isChecked) {
      this.startSearch();
    } else {
      this.stopSearch();
    }
  }

  startSearch() {
    this.combatService.addUserToFight(this.userId).subscribe();
    this.searching = true;
  }

  stopSearch() {
    this.combatService.removeUserToFight(this.userId).subscribe();
    this.searching = false;
  }

  getUsersSearchingFight() {
    this.combatService.getUsersSearchingFight().subscribe({
      next: data => this.opponentList.set(data),
      error: error => console.error('There was an error!', error)
    });
  }

  updateDemandeCombat(demandeCombat: DemandeCombat) {
    this.http.post<any>('https://pampacardsback-57cce2502b80.herokuapp.com/api/updateDemandeCombat', demandeCombat).subscribe({
      next: () => {
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  challengeOpponent(opponent: Utilisateur) {
    let firstPlayerId;

    if (this.chooseFirstPlayer && this.selectedFirstPlayer && this.selectedFirstPlayer == "Vous") {
      firstPlayerId = this.userId;
    } else if (this.chooseFirstPlayer && this.selectedFirstPlayer && this.selectedFirstPlayer == "Votre adversaire") {
      firstPlayerId = opponent.id;
    }

    const data = {
      joueurUnId: this.userId,
      joueurDeuxId: opponent.id,
      deckUnId: this.selectedDeck?.id,
      firstPlayerId: firstPlayerId,
      formatId: this.selectedFormat?.formatId,
      message: 'message'
    };

    this.combatService.createChallenge(data).subscribe({
      next: () => alert('Demande de combat envoyée'),
      error: error => {
        console.error('Erreur lors de la demande de combat', error);
        alert('Erreur lors de la demande de combat');
      }
    });
  }

  private subscribeToUserStream() {
    this.sseService.getRechercheAdversairesFlux();
    this.usersToFightSubscription = this.sseService.usersToFight$.subscribe(
      (utilisateurs: Utilisateur[]) => {
        this.opponentList.set(utilisateurs);
        this.cd.detectChanges();
      },
      (error: any) => console.error(error)
    );
  }

  private subscribeToDemandeCombatFlux() {
    this.sseService.getDemandeCombatFlux();
    this.demandesDeCombatSubscription = this.sseService.demandesDeCombat$.subscribe(
      (demandes: DemandeCombat[]) => {
        this.demandesCombats.set([]);
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
            this.demandesCombats.update((currentDemandes) => [...currentDemandes, demande]);
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

  showDialog(demande: DemandeCombat, decks: Deck[]) {
    this.zone.run(() => {
      const ref = this.dialogService.open(DemandeCombatDialogComponent, {
        header: demande.joueurUnPseudo + ' vous propose un combat !',
        width: '30%',
        height: '50vh',
        data: { demande : demande, decks: decks },
        closable: false
      });

      ref.onClose.subscribe((demandeCombat: DemandeCombat) => {
        this.demandesCombats.update((currentDemandes) => [...currentDemandes, demandeCombat]);
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

  deleteDemandeCombat(demandeCombat: DemandeCombat) {
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
    this.http.get<Partie>('https://pampacardsback-57cce2502b80.herokuapp.com/api/partieEnCours?utilisateurId=' + this.userId).subscribe({
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

  deleteDemande(demande: DemandeCombat) {
    this.deleteDemandeCombat(demande);
  }

  voirDemande(demande: DemandeCombat) {
    this.showDialog(demande, this.allDecks);
    this.cd.detectChanges();
  }

  refuserDemande(demande: DemandeCombat) {
    demande.status = DemandeCombatStatusEnum.DEMANDE_REFUSEE;
    let index = this.demandesCombats().findIndex(d => d.id === demande.id);
    if (index !== -1) {
      this.demandesCombats().splice(index, 1);
    }
    this.cd.detectChanges();
    this.updateDemandeCombat(demande);
  }

  onFormatChange() {
    this.filteredDecks = this.allDecks.filter(deck => deck.formats.some(format => format.formatId ===  this.selectedFormat?.formatId));
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
        return status;
    }
  }

  getFormatNomById(formatId: number): string {
    const format = this.formats.find(format => format.formatId === formatId);
    return format ? format.nom : 'Format non trouvé';
  }

  getBots() {
    this.combatService.getBots().subscribe({
      next: (bots: Utilisateur[]) => {
        this.botList = bots;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des bots', error);
      }
    });
  }

  challengeBot(bot: Utilisateur) {
    const data = {
      joueurUnId: this.userId,
      joueurDeuxId: bot.id,
      deckUnId: this.selectedDeckBot?.id,
      firstPlayerId: null,
      formatId: this.selectedFormat?.formatId,
      message: 'Défi contre un bot'
    };

    this.combatService.createBotPartie(data).subscribe({
      next: response => {
        this.router.navigate(['/partie', response]);
      },
      error: (error) => {
        console.error('Erreur lors du défi contre le bot', error);
        alert('Erreur lors du défi');
      }
    });
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
