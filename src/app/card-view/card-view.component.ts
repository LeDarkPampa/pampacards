import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Carte } from '../classes/cartes/Carte';
import { ReferentielService } from '../services/referentiel.service';
import { UiMessageService } from '../services/ui-message.service';
import { CARTE_VIEW_MSG } from '../core/messages/domain.messages';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css', '../app.component.css'],
})
export class CardViewComponent implements OnInit {
  carteId: number = 0;
  carte!: Carte;

  constructor(
    private referentielService: ReferentielService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private uiMessage: UiMessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.carteId = params['id'];
      this.referentielService.getCarteById(this.carteId).subscribe({
        next: (data) => {
          this.carte = data;
          this.cd.detectChanges();
        },
        error: () => {
          this.uiMessage.error(CARTE_VIEW_MSG.LOAD_ERR);
        },
      });
    });
  }
}
