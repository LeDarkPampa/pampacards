import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { IClan } from '../interfaces/IClan';
import {AuthentificationService} from "./authentification.service";
import {PropertiesService} from "./properties.service";
import {catchError} from "rxjs/operators";
import {Cacheable, LocalStorageStrategy} from "ts-cacheable";
import {IType} from "../interfaces/IType";
import {IFormat} from "../interfaces/IFormat";
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  protected BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  protected API_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';

  constructor() { }


}
