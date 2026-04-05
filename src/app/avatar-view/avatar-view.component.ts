import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar-view',
  templateUrl: './avatar-view.component.html',
  styleUrls: ['./avatar-view.component.css'],
})
export class AvatarViewComponent {
  @Input() head: string = '';
  @Input() hat: string = '';
  @Input() body: string = '';
  @Input() back: string = '';
  @Input() add: string = '';
  @Input() front: string = '';
}
