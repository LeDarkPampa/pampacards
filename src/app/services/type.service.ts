import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { IType } from '../interfaces/IType';
import {IClan} from "../interfaces/IClan";
import {catchError} from "rxjs/operators";
import {AuthentificationService} from "./authentification.service";
import {PropertiesService} from "./properties.service";

@Injectable({
  providedIn: 'root'
})
export class TypeService {
  private typesTestUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/testTypes';
  private typessUrl = 'https://pampacardsback-57cce2502b80.herokuapp.com/api/types';

  constructor(private http: HttpClient, private authService: AuthentificationService,
              private propertiesService: PropertiesService) { }

  getAllTypes(): Observable<IType[]> {
    let url = this.typessUrl;

    // @ts-ignore
    if (this.authService.getUser().testeur && this.propertiesService.isTestModeOn()) {
      url = this.typesTestUrl;
    }

    return this.http.get<IType[]>(url).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

}
