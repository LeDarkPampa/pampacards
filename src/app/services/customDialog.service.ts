import { Injectable } from '@angular/core';
import {ICarte} from "../interfaces/ICarte";
import {EffetEnum} from "../interfaces/EffetEnum";
import {IPlayerState} from "../interfaces/IPlayerState";
import {JoueurService} from "./joueur.service";
import {CarteService} from "./carte.service";
import {IPartie} from "../interfaces/IPartie";
import {TchatService} from "./tchat.service";
import {PartieService} from "./partie.service";
import {IPartieDatas} from "../interfaces/IPartieDatas";
import {SelectionCarteDialogComponent} from "../partie/selection-carte-dialog/selection-carte-dialog.component";
import {DialogService} from "primeng/dynamicdialog";
import {Subject} from "rxjs";
import {VisionCartesDialogComponent} from "../partie/vision-cartes-dialog/vision-cartes-dialog.component";

@Injectable({
  providedIn: 'root'
})
export class CustomDialogService {

  carteSelectionneeSubject = new Subject<ICarte>();
  public carteSelectionnee$ = this.carteSelectionneeSubject.asObservable();
  public secondeCarteSelectionnee$ = this.carteSelectionneeSubject.asObservable();

  constructor(private dialogService: DialogService) { }

  selectionnerCarte(cartes: ICarte[]): Promise<ICarte | null> {
    return new Promise((resolve, reject) => {
      let carteSelectionneeSub = this.carteSelectionnee$.subscribe(
        (selectedCarte: ICarte) => {
          resolve(selectedCarte);
          carteSelectionneeSub.unsubscribe();
        },
        (error: any) => {
          reject(error);
          carteSelectionneeSub.unsubscribe();
        }
      );

      this.showSelectionCarteDialog(cartes);
    });
  }

  showSelectionCarteDialog(cartes: ICarte[]): void {
    const ref = this.dialogService.open(SelectionCarteDialogComponent, {
      header: 'Sélectionnez une carte cible',
      width: '50%',
      data: { cartes },
      closable: false
    });

    ref.onClose.subscribe(selectedCarte => {
      this.carteSelectionneeSubject.next(selectedCarte);
    });
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
}
