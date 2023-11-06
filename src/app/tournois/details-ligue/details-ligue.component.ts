import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {AuthentificationService} from "../../services/authentification.service";
import {DialogService} from "primeng/dynamicdialog";
import {SseService} from "../../services/sse.service";
import {ILigue} from "../../interfaces/ILigue";
import {ICompetitionParticipant} from "../../interfaces/ICompetitionParticipant";

@Component({
  selector: 'app-details-ligue',
  templateUrl: './details-ligue.component.html',
  styleUrls: ['./details-ligue.component.css', '../../app.component.css']
})
export class DetailsLigueComponent implements OnInit {

  ligueId: number = 0;
  // @ts-ignore
  ligue: ILigue;
  players: ICompetitionParticipant[] = [];
  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";

  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone,
              private sseService: SseService, private cd: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.ligueId = params['id'];
      this.getLigue();
      this.cd.detectChanges();
    });
  }

  private getLigue() {
    this.http.get<ILigue>(`${this.BACKEND_URL}/ligues/ligue?id=` + this.ligueId).subscribe({
      next: ligue => {
        this.ligue = ligue;
        this.players = this.ligue.participants;
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }
}
