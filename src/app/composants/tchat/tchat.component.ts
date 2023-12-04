import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {IChatPartieMessage} from "../../interfaces/IChatPartieMessage";
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {SseService} from "../../services/sse.service";
import {Subscription} from "rxjs";
import {IPlayerState} from "../../interfaces/IPlayerState";

@Component({
  selector: 'app-tchat',
  templateUrl: './tchat.component.html',
  styleUrls: ['./tchat.component.css', '../../app.component.css']
})
export class TchatComponent implements OnInit, OnDestroy {

  @Input() partieId: number = 0;
  // @ts-ignore
  @Input() joueur: IPlayerState;

  // @ts-ignore
  private tchatSubscription: Subscription;

  chatMessages: IChatPartieMessage[] = [];
  message: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute,
              private sseService: SseService, private cd: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getChatPartieMessages();
      this.subscribeToChatMessagesFlux();
      this.cd.detectChanges();
    });
  }

  private subscribeToChatMessagesFlux() {
    this.sseService.getChatMessagesFlux(this.partieId);
    this.tchatSubscription = this.sseService.chatMessages$.subscribe(
      (chatPartieMessages: IChatPartieMessage[]) => {
        // @ts-ignore
        this.chatMessages = chatPartieMessages;
        this.cd.detectChanges();
      },
      (error: any) => console.error(error)
    );
  }

  private getChatPartieMessages() {
    this.http.get<IChatPartieMessage[]>('https://pampacardsback-57cce2502b80.herokuapp.com/api/chatMessages?partieId=' + this.partieId).subscribe({
      next: chatMessages => {
        // @ts-ignore
        this.chatMessages = chatMessages;
      },
      error: error => {
        console.error('There was an error!', error);
      }
    });
  }

  ngOnDestroy() {
    if (this.tchatSubscription) {
      this.tchatSubscription.unsubscribe();
    }

    this.sseService.closeEvenementsChatEventSource();
  }
}
