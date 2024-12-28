import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {UtilisateurService} from "../../services/utilisateur.service";
import {AuthentificationService} from "../../services/authentification.service";
import { Avatar } from 'src/app/classes/Avatar';

@Component({
  selector: 'app-avatar-builder',
  standalone: true,
  imports: [
    NgForOf,
    NgIf
  ],
  templateUrl: './avatar-builder.component.html',
  styleUrls: ['./avatar-builder.component.css']
})
export class AvatarBuilderComponent implements OnInit {
  parts = {
    heads: [] as string[],
    hats: [] as string[],
    bodies: [] as string[],
    backs: [] as string[]
  };

  private avatar?: Avatar;

  selectedParts: SelectedParts = {
    head: '',
    hat: '',
    body: '',
    back: ''
  };

  constructor(private http: HttpClient, private utilisateurService: UtilisateurService, private authentificationService: AuthentificationService) {}

  ngOnInit() {
    this.http.get<{ heads: string[]; hats: string[]; bodies: string[]; backs: string[] }>('assets/avatars/avatars.json')
      .subscribe(data => {
        this.parts = data;
        // Initialiser selectedParts avec des valeurs par défaut au cas où l'avatar n'est pas encore chargé
        this.selectedParts = {
          head: data.heads[0] || '',
          hat: '',
          body: data.bodies[0] || '',
          back: data.backs[0] || ''
        };
      });

    this.utilisateurService.getAvatar(this.authentificationService.getUserId()).subscribe({
      next: data => {
        this.avatar = data;
        this.selectedParts = {
          head: this.avatar.tete || '',
          hat: this.avatar.chapeau || '',
          body: this.avatar.corps || '',
          back: this.avatar.dos || ''
        };
      },
      error: error => {
        console.error('There was an error!', error);
        alert('Erreur lors de la récupération des utilisateurs');
      }
    });
  }


  selectPart(part: keyof SelectedParts, value: string) {
    this.selectedParts[part] = value;
  }
}

type SelectedParts = {
  head: string;
  hat: string;
  body: string;
  back: string;
};
