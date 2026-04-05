import {Component, OnInit} from '@angular/core';
import {Partie} from "../../classes/parties/Partie";
import {Router} from "@angular/router";

import {ResultatPartie} from "../../classes/parties/ResultatPartie";
import {VisionCartesDialogComponent} from "../../partie/vision-cartes-dialog/vision-cartes-dialog.component";
import {DialogService} from "primeng/dynamicdialog";
import {AdministrationService} from "../../services/administration.service";
import {Carte} from "../../classes/cartes/Carte";
import { UiMessageService } from '../../services/ui-message.service';
import { ADMIN_MSG } from '../../core/messages/domain.messages';

@Component({
  selector: 'app-administration-parties',
  templateUrl: './administration-parties.component.html',
  styleUrls: ['./administration-parties.component.css', '../../app.component.css']
})
export class AdministrationPartiesComponent implements OnInit {
  partiesEnCours: Partie[] = [];
  resultatsParties: ResultatPartie[] = [];

  constructor(private router: Router, private dialogService: DialogService,
              private administrationService: AdministrationService,
              private uiMessage: UiMessageService) {

  }

  ngOnInit(): void {
    this.administrationService.getPartiesEnCours().subscribe({
      next: data => {
        this.partiesEnCours = data;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.PARTIES_LOAD_ERR);
      }
    });

    this.administrationService.getResultatsParties().subscribe({
      next: data => {
        this.resultatsParties = data;
      },
      error: () => {
        this.uiMessage.error(ADMIN_MSG.RESULTATS_LOAD_ERR);
      }
    });
  }

  observerPartie(partieId: number) {
    this.router.navigate(['/partie-obs', partieId, 'obs']);
  }

  showDeck(jsonDeck: string) {
    const deck = jsonDeck.length > 0 ? JSON.parse(jsonDeck) : [];

    this.showVisionCartesDialog(deck);
  }

  showVisionCartesDialog(cartes: Carte[]): void {
    const ref = this.dialogService.open(VisionCartesDialogComponent, {
      header: '',
      width: '50%',
      data: { cartes },
      closable: false
    });

    ref.onClose.subscribe(() => {
    });
  }

  openReplay(partieId: any) {
    this.router.navigate(['/partie-obs', partieId, 'replay']);
  }
}
