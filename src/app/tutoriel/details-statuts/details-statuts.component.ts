import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Clan } from '../../classes/cartes/Clan';
import { Type } from '../../classes/cartes/Type';
import { CartePartie } from '../../classes/cartes/CartePartie';
import { ReferentielService } from '../../services/referentiel.service';
import { UiMessageService } from '../../services/ui-message.service';
import { CARTE_VIEW_MSG } from '../../core/messages/domain.messages';

const DEMO_CARTE_ID = 1110;

@Component({
  selector: 'app-details-statuts',
  templateUrl: './details-statuts.component.html',
  styleUrls: ['./details-statuts.component.css', '../../app.component.css']
})
export class DetailsStatutsComponent implements OnInit {

  normale?: CartePartie;
  bouclier?: CartePartie;
  insensible?: CartePartie;
  corrompu?: CartePartie;
  silence?: CartePartie;
  indestructible?: CartePartie;
  prison?: CartePartie;

  loading = true;
  loadFailed = false;

  private readonly clanCorrompu: Clan = { id: 0, nom: 'Corrompu' };
  private readonly typeCorrompu: Type = { id: 0, nom: 'Corrompu' };

  constructor(
    private referentielService: ReferentielService,
    private cd: ChangeDetectorRef,
    private uiMessage: UiMessageService
  ) {}

  ngOnInit(): void {
    this.referentielService.getCarteById(DEMO_CARTE_ID).subscribe({
      next: data => {
        const src = data as CartePartie;
        const base = this.demoBase(src);
        this.normale = base;
        this.bouclier = { ...base, bouclier: true };
        this.indestructible = { ...base, bouclier: true };
        this.corrompu = {
          ...base,
          clan: this.clanCorrompu,
          type: this.typeCorrompu
        };
        this.insensible = { ...base, insensible: true };
        this.silence = { ...base, silence: true };
        this.prison = { ...base, prison: true };
        this.loading = false;
        this.loadFailed = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadFailed = true;
        this.uiMessage.error(CARTE_VIEW_MSG.LOAD_ERR);
        this.cd.detectChanges();
      }
    });
  }

  private demoBase(carte: CartePartie): CartePartie {
    return {
      id: carte.id,
      nom: carte.nom,
      clan: carte.clan,
      type: carte.type,
      rarete: carte.rarete,
      effet: carte.effet,
      puissance: carte.puissance,
      image_path: carte.image_path,
      diffPuissanceInstant: carte.diffPuissanceInstant,
      diffPuissanceContinue: carte.diffPuissanceContinue,
      released: carte.released,
      silence: false,
      bouclier: false,
      insensible: false,
      prison: false,
      cartePartieId: 0
    };
  }
}
