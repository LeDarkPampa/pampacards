import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TournoiService } from "../../services/tournoi.service";
import { IFormat } from "../../interfaces/IFormat";
import { HttpClient } from "@angular/common/http";
import { ITypeCombat } from "../../interfaces/ITypeCombat";
import { ITournoi } from "../../interfaces/ITournoi";
import {ILigue} from "../../interfaces/ILigue";
import {LigueTournoiStatutEnum} from "../../interfaces/LigueTournoiStatutEnum";

@Component({
  selector: 'app-administration-tournois',
  templateUrl: './administration-tournois.component.html',
  styleUrls: ['./administration-tournois.component.css', '../../app.component.css']
})
export class AdministrationTournoisComponent implements OnInit {
  tournoiForm: FormGroup;
  ligueForm: FormGroup;

  formats: IFormat[] = [];
  typesCombat: ITypeCombat[] = [];
  tournois: ITournoi[] = [];
  ligues: ILigue[] = [];

  statutsTournoi: string[] = Object.values(LigueTournoiStatutEnum);

  constructor(private http: HttpClient, private fb: FormBuilder, private tournoiService: TournoiService) {
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
    this.http.get<IFormat[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/formats').subscribe({
      next: data => {
        data.forEach(format => this.formats.push(format));
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  private getAllTypesCombat() {
    this.http.get<ITypeCombat[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/typesCombat').subscribe({
      next: data => {
        data.forEach(typeCombat => this.typesCombat.push(typeCombat));
      },
      error: error => {
        console.error('There was an error!', error);
      }
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

  saveTournoi(tournoi: ITournoi) {
    this.tournoiService.saveTournoi(tournoi).subscribe(
      (modified) => {
        this.loadTournois();
      },
      (error) => {
        console.error('Erreur lors de la modification du tournoi :', error);
      }
    );
  }

  saveLigue(ligue: ILigue) {
    this.tournoiService.saveLigue(ligue).subscribe(
      (modified) => {
        this.loadLigues();
      },
      (error) => {
        console.error('Erreur lors de la modification de la ligue :', error);
      }
    );
  }

  deleteTournoi(tournoi: ITournoi) {
    this.tournoiService.deleteTournoi(tournoi.id).subscribe(
      (modified) => {
        this.loadTournois();
      },
      (error) => {
        console.error('Erreur lors de la suppression du tournoi :', error);
      }
    );
  }

  deleteLigue(ligue: ILigue) {
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
