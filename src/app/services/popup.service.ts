import { Injectable } from '@angular/core';
import {finalize, first, Observable, Observer, of, Subject, tap} from "rxjs";
import {ICarte} from "../interfaces/ICarte";
import {SelectionCarteDialogComponent} from "../partie/selection-carte-dialog/selection-carte-dialog.component";
import {DialogService} from "primeng/dynamicdialog";
import {VisionCartesDialogComponent} from "../partie/vision-cartes-dialog/vision-cartes-dialog.component";
import {catchError} from "rxjs/operators";
import {IPlayerState} from "../interfaces/IPlayerState";
import {TchatService} from "./tchat.service";

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  constructor(private dialogService: DialogService, private tchatService: TchatService) { }

  carteSelectionneeSubject = new Subject<ICarte>();
  carteSelectionnee$ = this.carteSelectionneeSubject.asObservable();

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

  selectAndHandleCard(cards: ICarte[], joueur: IPlayerState, partieId: number): Observable<ICarte> {
    this.showSelectionCarteDialog(cards);

    return new Observable((observer: Observer<ICarte>) => {
      const carteSelectionneeSub = this.carteSelectionnee$
        .pipe(
          first(),
          tap(selectedCarte => {
            if (selectedCarte) {
              this.tchatService.sendMessage(`${joueur.nom} cible la carte ${selectedCarte.nom}`, partieId);
              const indexCarte = cards.findIndex(carteCheck => JSON.stringify(carteCheck) === JSON.stringify(selectedCarte));
              observer.next(selectedCarte);
            } else {
              this.tchatService.sendMessage('Aucune carte sélectionnée', partieId);
            }
          }),
          catchError(error => {
            console.error(error);
            observer.error(error);
            return of(null);
          }),
          finalize(() => {
            carteSelectionneeSub.unsubscribe();
          })
        )
        .subscribe();
    });
  }

}
