import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  protected BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";
  protected API_URL = 'https://pampacardsback-57cce2502b80.herokuapp.com/api';

  constructor() { }


}
