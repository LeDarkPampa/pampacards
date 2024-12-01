import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Propertie} from "../classes/Propertie";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class PropertiesService extends ApiService {
  testModeOn = false;

  constructor(private http: HttpClient) {
    super();
    this.loadProperties();
  }

  loadProperties() {
    this.fetchProperties();
  }

  private fetchProperties() {
    this.http.get<Propertie[]>(this.API_URL + '/properties').subscribe({
      next: (data: Propertie[]) => {
        const showTestProperty = data.find(property => property.code === 'SHOW_TEST');

        if (showTestProperty) {
          this.testModeOn = showTestProperty.value;
          localStorage.setItem('testModeOn', JSON.stringify(this.testModeOn));
        }
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des properties');
      }
    });
  }

  isTestModeOn() {
    const testModeOnString = localStorage.getItem('testModeOn');
    if (testModeOnString) {
      const testModeOn = JSON.parse(testModeOnString);
      return testModeOn === true;
    } else {
      return false;
    }
  }
}
