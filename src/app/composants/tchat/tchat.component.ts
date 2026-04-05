import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ChatPartieMessage } from '../../classes/ChatPartieMessage';
import { ActivatedRoute } from '@angular/router';
import { SseService } from '../../services/sse.service';
import { Subscription } from 'rxjs';
import { TchatService } from '../../services/tchat.service';

@Component({
  selector: 'app-tchat',
  templateUrl: './tchat.component.html',
  styleUrls: ['./tchat.component.css', '../../app.component.css'],
})
export class TchatComponent implements OnInit, OnDestroy {
  @Input() partieId: number = 0;

  private tchatSubscription?: Subscription;

  chatMessages: ChatPartieMessage[] = [];
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private sseService: SseService,
    private cd: ChangeDetectorRef,
    private tchatService: TchatService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(() => {
      this.getChatPartieMessages();
      this.subscribeToChatMessagesFlux();
      this.cd.detectChanges();
    });
  }

  private subscribeToChatMessagesFlux() {
    this.sseService.getChatMessagesFlux(this.partieId);
    this.tchatSubscription = this.sseService.chatMessages$.subscribe(
      (chatPartieMessages: ChatPartieMessage[]) => {
        this.chatMessages = chatPartieMessages;
        this.cd.detectChanges();
      },
      () => {}
    );
  }

  private getChatPartieMessages() {
    this.tchatService.getChatMessages(this.partieId).subscribe({
      next: (chatMessages) => {
        this.chatMessages = chatMessages;
      },
    });
  }

  ngOnDestroy() {
    if (this.tchatSubscription) {
      this.tchatSubscription.unsubscribe();
    }

    this.sseService.closeEvenementsChatEventSource();
  }
}
