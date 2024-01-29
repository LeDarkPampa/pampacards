import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {IPropertie} from "../interfaces/IPropertie";

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  testModeOn = false;

  constructor(private http: HttpClient) {
    this.loadProperties();
  }

  loadProperties() {
    this.fetchProperties();
  }

  private fetchProperties() {
    this.http.get<IPropertie[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/properties').subscribe({
      next: (data: IPropertie[]) => {
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
