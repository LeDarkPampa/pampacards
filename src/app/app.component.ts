import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {IClan} from "./interfaces/IClan";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  clans: String[] = [];

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {
    this.getAllClans();
  }

  ngOnInit() {
    this.cd.detectChanges();
  }

  getAllClans() {
    this.http.get<IClan[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/clans').subscribe({
      next: data => {
        data.forEach(clan => this.clans.push(clan.nom));
      },
      error: error => {
        this.clans.push("Erreur sur la récupération des clans")
        console.error('There was an error!', error);
      }
    })
  }
}
