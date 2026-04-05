import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  protected readonly BACKEND_URL = environment.apiBaseUrl;
  protected readonly API_URL = `${environment.apiBaseUrl}/api`;

  constructor() {}
}
