import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TournoiService } from "../../services/tournoi.service";
import { Format } from "../../classes/decks/Format";
import { HttpClient } from "@angular/common/http";
import { TypeCombat } from "../../classes/TypeCombat";
import { Tournoi } from "../../classes/competitions/Tournoi";
import {Ligue} from "../../classes/competitions/Ligue";
import {LigueTournoiStatutEnum} from "../../enums/LigueTournoiStatutEnum";
import {Message} from "primeng/api";
import {ReferentielService} from "../../services/referentiel.service";

@Component({
  selector: 'app-administration-tournois',
  templateUrl: './administration-tournois.component.html',
  styleUrls: ['./administration-tournois.component.css', '../../app.component.css']
})
export class AdministrationTournoisComponent implements OnInit {
  tournoiForm: FormGroup;
  ligueForm: FormGroup;

  formats: Format[] = [];
  typesCombat: TypeCombat[] = [];
  tournois: Tournoi[] = [];
  ligues: Ligue[] = [];

  statutsTournoi: string[] = Object.values(LigueTournoiStatutEnum);
  message: Message[] = [];

  constructor(private http: HttpClient, private fb: FormBuilder, private tournoiService: TournoiService,
              private referentielService: ReferentielService) {
    this.tournoiForm = this.fb.group({
      nom: ['', Validators.required],
      nombreDeJoueurs: [4, Validators.min(4)],
      format: [null, Validators.required],
      typeCombat: [null, Validators.required],
      statut: [null, Validators.required],
    });

    this.ligueForm = this.fb.group({
      nom: ['', Validators.required],
      format: [null, Validators.required],
      typeCombat: [null, Validators.required],
      statut: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.getAllFormats();
    this.getAllTypesCombat();
    this.loadTournois();
    this.loadLigues();
  }

  onSubmitTournoi() {
    // @ts-ignore
    if (this.tournoiForm.valid && this.tournoiForm.get('typeCombat').value) {
      const newTournoi = this.tournoiForm.value;
      this.tournoiService.saveTournoi(newTournoi).subscribe(
        (createdTournoi) => {
          console.log('Tournoi créé avec succès :', createdTournoi);
          this.tournoiForm.reset();
          this.loadTournois();
        },
        (error) => {
          console.error('Erreur lors de la création du tournoi :', error);
        }
      );
    }
  }

  onSubmitLigue() {
    // @ts-ignore
    if (this.ligueForm.valid && this.ligueForm.get('typeCombat').value) {
      const newLigue = this.ligueForm.value;
      this.tournoiService.saveLigue(newLigue).subscribe(
        (createdLigue) => {
          console.log('Ligue créée avec succès :', createdLigue);
          this.ligueForm.reset();
          this.loadLigues();
        },
        (error) => {
          console.error('Erreur lors de la création du tournoi :', error);
        }
      );
    }
  }

  updateTypeCombat(tournoi: any, event: any) {
    const selectedTypeCombat = event.target.value;
    const selectedType = this.typesCombat.find(type => type.nom === selectedTypeCombat);
    if (selectedType) {
      tournoi.typeCombat = selectedType;
    }
  }

  private getAllFormats() {
    this.referentielService.getAllFormats().subscribe(formats => {
      this.formats = formats;
    });
  }

  private getAllTypesCombat() {
    this.referentielService.getAllTypesCombat().subscribe(typesCombat => {
      this.typesCombat = typesCombat;
    });
  }

  private loadTournois() {
    this.tournoiService.getAllTournois().subscribe(
      (data) => {
        this.tournois = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des tournois :', error);
      }
    );
  }

  private loadLigues() {
    this.tournoiService.getAllLigues().subscribe(
      (data) => {
        this.ligues = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des ligues :', error);
      }
    );
  }

  saveTournoi(tournoi: Tournoi) {
    this.tournoiService.saveTournoi(tournoi).subscribe(
      (modified) => {
        this.message = [
          { severity: 'success', summary: 'Sauvegarde', detail: 'Tournoi sauvegardé' },
        ];
        this.loadTournois();
      },
      (error) => {
        console.error('Erreur lors de la modification du tournoi :', error);
      }
    );
  }

  saveLigue(ligue: Ligue) {
    this.tournoiService.saveLigue(ligue).subscribe(
      (modified) => {
        this.message = [
          { severity: 'success', summary: 'Sauvegarde', detail: 'Ligue sauvegardée' },
        ];
        this.loadLigues();
      },
      (error) => {
        console.error('Erreur lors de la modification de la ligue :', error);
      }
    );
  }

  deleteTournoi(tournoi: Tournoi) {
    this.tournoiService.deleteTournoi(tournoi.id).subscribe(
      (modified) => {
        this.loadTournois();
      },
      (error) => {
        console.error('Erreur lors de la suppression du tournoi :', error);
      }
    );
  }

  deleteLigue(ligue: Ligue) {
    this.tournoiService.deleteLigue(ligue.id).subscribe(
      (modified) => {
        this.loadLigues();
      },
      (error) => {
        console.error('Erreur lors de la suppression de la ligue :', error);
      }
    );

  }
}
