import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {ICarte} from "../interfaces/ICarte";
import {IPartie} from "../interfaces/IPartie";

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css', '../app.component.css']
})
export class CardViewComponent implements OnInit {

  carteId: number = 0;
  // @ts-ignore
  carte: ICarte;

  constructor(private http: HttpClient, private route: ActivatedRoute, private cd: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.carteId = params['id'];
      this.http.get<ICarte>('https://pampacardsback-57cce2502b80.herokuapp.com/api/carte?carteId=' + this.carteId).subscribe({
        next: data => {
          this.carte = data;
          this.cd.detectChanges();
        },
        error: error => {
          console.error('There was an error!', error);
        }
    });
    })
  }
}
