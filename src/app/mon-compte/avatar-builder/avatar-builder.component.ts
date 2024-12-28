import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {UtilisateurService} from "../../services/utilisateur.service";
import {AuthentificationService} from "../../services/authentification.service";
import { Avatar } from 'src/app/classes/Avatar';
import {AvatarService} from "../../services/avatar.service";
import {AvatarPart} from "../../classes/AvatarPart";

@Component({
  selector: 'app-avatar-builder',
  templateUrl: './avatar-builder.component.html',
  styleUrls: ['./avatar-builder.component.css', '../../app.component.css']
})
export class AvatarBuilderComponent implements OnInit {
  parts = {
    heads: [] as string[],
    hats: [] as string[],
    bodies: [] as string[],
    backs: [] as string[]
  };

  private avatar?: Avatar;

  selectedParts: AvatarPart = {
    head: '',
    hat: '',
    body: '',
    back: ''
  };

  constructor(private http: HttpClient, private utilisateurService: UtilisateurService,
              private authentificationService: AuthentificationService, private avatarService: AvatarService) {}

  ngOnInit(): void {
    this.avatarService.getAvatar().subscribe({
      next: avatar => {
        this.avatar = avatar;
        this.selectedParts = {
          head: avatar.tete,
          hat: avatar.chapeau,
          body: avatar.corps,
          back: avatar.dos
        };
      },
      error: error => {
        console.error('Erreur lors de la récupération de l\'avatar', error);
        alert('Erreur lors de la récupération de l\'avatar');
      }
    });

    this.http.get<{ heads: string[]; hats: string[]; bodies: string[]; backs: string[] }>('assets/avatars/avatars.json')
      .subscribe(data => {
        this.parts = data;
      });
  }

  selectPart(part: keyof AvatarPart, value: string) {
    this.selectedParts[part] = value;
  }

  saveAvatar() {
    const updatedAvatar: Avatar = {
      id: this.avatar?.id ? this.avatar?.id : 0,
      utilisateurId: this.authentificationService.getUserId(),
      tete: this.selectedParts.head,
      chapeau: this.selectedParts.hat,
      corps: this.selectedParts.body,
      dos: this.selectedParts.back
    };

    this.utilisateurService.saveAvatar(updatedAvatar).subscribe({
      next: (response) => {
        alert('Avatar sauvegardé avec succès !');
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde de l\'avatar', error);
        alert('Erreur lors de la sauvegarde de l\'avatar');
      }
    });
  }
}
