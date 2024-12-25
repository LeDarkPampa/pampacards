import {Injectable, NgZone} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {Router} from "@angular/router";
import {DialogService} from "primeng/dynamicdialog";
import {ApiService} from "../../services/api.service";
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class LgGameService extends ApiService {

  constructor(private http: HttpClient, private zone: NgZone, private router: Router, private dialogService: DialogService) {
    super();
  }

  getPartieCode(partieId: number): Observable<string> {
    return this.http.get(`${this.API_URL}/lg/game/partieCode?partieId=${partieId}`, { responseType: 'text' })
      .pipe(
        catchError(error => {
          console.error('Error occurred:', error);
          return throwError(error);
        })
      );
  }
}
