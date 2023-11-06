import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {AuthentificationService} from "../../services/authentification.service";
import {DialogService} from "primeng/dynamicdialog";
import {SseService} from "../../services/sse.service";
import {ITournoi} from "../../interfaces/ITournoi";
import {ICompetitionParticipant} from "../../interfaces/ICompetitionParticipant";

@Component({
  selector: 'app-details-tournoi',
  templateUrl: './details-tournoi.component.html',
  styleUrls: ['./details-tournoi.component.css', '../../app.component.css']
})
export class DetailsTournoiComponent implements OnInit {

  tournoiId: number = 0;
  // @ts-ignore
  tournoi: ITournoi;

  players: ICompetitionParticipant[] = [];

  private BACKEND_URL = "https://pampacardsback-57cce2502b80.herokuapp.com";


  constructor(private http: HttpClient, private route: ActivatedRoute, private authService: AuthentificationService,
              private dialogService: DialogService, private zone: NgZone,
              private sseService: SseService, private cd: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tournoiId = params['id'];
      this.getTournoi();
      this.cd.detectChanges();
    });
  }

  private getTournoi() {
    this.http.get<ITournoi>(`${this.BACKEND_URL}/tournois/tournoi?id=` + this.tournoiId).subscribe({
      next: tournoi => {
        this.tournoi = tournoi;
        this.players = this.tournoi.participants;
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }
}
