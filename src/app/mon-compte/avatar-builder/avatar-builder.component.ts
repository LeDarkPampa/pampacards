import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Message } from 'primeng/api';
import { UtilisateurService } from '../../services/utilisateur.service';
import { AuthentificationService } from '../../services/authentification.service';
import { AvatarService } from '../../services/avatar.service';
import { Avatar } from '../../classes/Avatar';
import { ElementDebloque } from '../../classes/ElementDebloque';
import { CanComponentDeactivate } from '../../CanComponentDeactivate';
import { AVATAR_MSG, AVATAR_UI } from './avatar-builder-messages';

export type AvatarSlot = 'head' | 'hat' | 'body' | 'back' | 'add' | 'front';
export type AvatarPartsKey = 'heads' | 'hats' | 'bodies' | 'backs' | 'adds' | 'fronts';

export interface AvatarPieceItem {
  src: string;
  category: string;
}

export interface AvatarCatalog {
  heads: AvatarPieceItem[];
  hats: AvatarPieceItem[];
  bodies: AvatarPieceItem[];
  backs: AvatarPieceItem[];
  adds: AvatarPieceItem[];
  fronts: AvatarPieceItem[];
}

export interface AvatarSectionDef {
  slot: AvatarSlot;
  partsKey: AvatarPartsKey;
  title: string;
  optionalEmpty: boolean;
  ariaPieceLabel: string;
}

const PARTS_KEYS: AvatarPartsKey[] = ['heads', 'hats', 'bodies', 'backs', 'adds', 'fronts'];

const SLOT_TO_PARTS: Record<AvatarSlot, AvatarPartsKey> = {
  head: 'heads',
  hat: 'hats',
  body: 'bodies',
  back: 'backs',
  add: 'adds',
  front: 'fronts',
};

const PARTS_TO_SLOT: Record<AvatarPartsKey, AvatarSlot> = {
  heads: 'head',
  hats: 'hat',
  bodies: 'body',
  backs: 'back',
  adds: 'add',
  fronts: 'front',
};

@Component({
  selector: 'app-avatar-builder',
  templateUrl: './avatar-builder.component.html',
  styleUrls: ['./avatar-builder.component.css', '../../app.component.css'],
})
export class AvatarBuilderComponent implements OnInit, CanComponentDeactivate {
  readonly sections: AvatarSectionDef[] = [
    {
      slot: 'hat',
      partsKey: 'hats',
      title: 'Choix du chapeau',
      optionalEmpty: true,
      ariaPieceLabel: 'chapeau',
    },
    {
      slot: 'head',
      partsKey: 'heads',
      title: 'Choix de la tête',
      optionalEmpty: false,
      ariaPieceLabel: 'tête',
    },
    {
      slot: 'body',
      partsKey: 'bodies',
      title: 'Choix du corps',
      optionalEmpty: false,
      ariaPieceLabel: 'corps',
    },
    {
      slot: 'back',
      partsKey: 'backs',
      title: 'Choix du dos',
      optionalEmpty: true,
      ariaPieceLabel: 'élément dos',
    },
    {
      slot: 'add',
      partsKey: 'adds',
      title: "Choix de l'élément d'arrière-plan",
      optionalEmpty: true,
      ariaPieceLabel: "arrière-plan",
    },
    {
      slot: 'front',
      partsKey: 'fronts',
      title: "Choix de l'élément supplémentaire",
      optionalEmpty: true,
      ariaPieceLabel: 'élément avant-plan',
    },
  ];

  parts: AvatarCatalog = {
    heads: [],
    hats: [],
    bodies: [],
    backs: [],
    adds: [],
    fronts: [],
  };

  categories: Record<AvatarPartsKey, string[]> = {
    heads: [],
    hats: [],
    bodies: [],
    backs: [],
    adds: [],
    fronts: [],
  };

  filteredParts: Record<AvatarPartsKey, AvatarPieceItem[]> = {
    heads: [],
    hats: [],
    bodies: [],
    backs: [],
    adds: [],
    fronts: [],
  };

  selectedCategories: Record<AvatarPartsKey, string> = {
    heads: '',
    hats: '',
    bodies: '',
    backs: '',
    adds: '',
    fronts: '',
  };

  /** Onglets visibles (débloqués ou contenant la pièce équipée). */
  visibleTabCategories: Record<AvatarPartsKey, string[]> = {
    heads: [],
    hats: [],
    bodies: [],
    backs: [],
    adds: [],
    fronts: [],
  };

  selectedParts: Record<AvatarSlot, string> = {
    head: '',
    hat: '',
    body: '',
    back: '',
    add: '',
    front: '',
  };

  private savedPartsSnapshot: Record<AvatarSlot, string> = {
    head: '',
    hat: '',
    body: '',
    back: '',
    add: '',
    front: '',
  };

  private avatar?: Avatar;

  debloqueElements: ElementDebloque[] = [];

  loading = true;

  message: Message[] = [];

  constructor(
    private http: HttpClient,
    private utilisateurService: UtilisateurService,
    private authentificationService: AuthentificationService,
    private avatarService: AvatarService
  ) {}

  ngOnInit(): void {
    this.loadBuilderData();
  }

  get hasUnsavedChanges(): boolean {
    return JSON.stringify(this.selectedParts) !== JSON.stringify(this.savedPartsSnapshot);
  }

  canDeactivate(): boolean {
    if (!this.hasUnsavedChanges) {
      return true;
    }
    return window.confirm(AVATAR_MSG.LEAVE_CONFIRM);
  }

  loadBuilderData(): void {
    this.loading = true;
    this.message = [];
    const userId = this.authentificationService.getUserId();
    forkJoin({
      avatar: this.avatarService.getAvatar(),
      debloques: this.utilisateurService.getElementsDebloques(userId),
      catalog: this.http.get<AvatarCatalog>('assets/avatars/avatars.json'),
    }).subscribe({
      next: ({ avatar, debloques, catalog }) => {
        this.applyLoadedData(avatar, debloques, catalog);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.message = [{ severity: 'error', summary: AVATAR_UI.ERROR, detail: AVATAR_MSG.LOAD_FAILED }];
      },
    });
  }

  filterParts(partType: AvatarPartsKey, category: string): void {
    this.selectedCategories[partType] = category;
    this.filteredParts[partType] = category
      ? this.parts[partType].filter((item) => item.category === category)
      : [];
    this.refreshVisibleTabCategories();
  }

  selectPart(part: AvatarSlot, value: string): void {
    this.selectedParts[part] = value;

    if (value === '') {
      const categoryKey = SLOT_TO_PARTS[part];
      this.selectedCategories[categoryKey] = '';
      this.filteredParts[categoryKey] = [];
    }

    this.refreshVisibleTabCategories();
  }

  onPieceClick(slot: AvatarSlot, piece: AvatarPieceItem): void {
    if (!this.isDebloquePiece(piece)) {
      this.message = [{ severity: 'warn', summary: AVATAR_UI.WARN, detail: AVATAR_MSG.PIECE_LOCKED }];
      return;
    }
    this.selectPart(slot, piece.src);
    const pk = SLOT_TO_PARTS[slot];
    const cat = piece.category;
    if (this.selectedCategories[pk] !== cat) {
      this.filterParts(pk, cat);
    }
  }

  onPieceKeydown(event: KeyboardEvent, slot: AvatarSlot, piece: AvatarPieceItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onPieceClick(slot, piece);
    }
  }

  clearOptionalSlot(slot: AvatarSlot): void {
    this.selectPart(slot, '');
  }

  saveAvatar(): void {
    if (this.loading) {
      return;
    }

    const updatedAvatar: Avatar = {
      id: this.avatar?.id ? this.avatar.id : 0,
      utilisateurId: this.authentificationService.getUserId(),
      tete: this.selectedParts.head,
      chapeau: this.selectedParts.hat,
      corps: this.selectedParts.body,
      dos: this.selectedParts.back,
      add: this.selectedParts.add,
      front: this.selectedParts.front,
    };

    this.utilisateurService.saveAvatar(updatedAvatar).subscribe({
      next: () => {
        this.avatar = { ...updatedAvatar };
        this.savedPartsSnapshot = { ...this.selectedParts };
        this.message = [{ severity: 'success', summary: AVATAR_UI.SUCCESS, detail: AVATAR_MSG.SAVED }];
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde de l\'avatar', error);
        this.message = [{ severity: 'error', summary: AVATAR_UI.ERROR, detail: AVATAR_MSG.SAVE_FAILED }];
      },
    });
  }

  cancelChanges(): void {
    this.selectedParts = { ...this.savedPartsSnapshot };
    this.message = [];
    this.reapplyFiltersAfterSnapshotRestore();
  }

  isDebloquePiece(element: AvatarPieceItem): boolean {
    return this.debloqueElements.some((d) => d.elementCode === element.src);
  }

  trackBySrc(_i: number, item: AvatarPieceItem): string {
    return item.src;
  }

  private applyLoadedData(avatar: Avatar, debloques: ElementDebloque[], data: AvatarCatalog): void {
    this.avatar = avatar;
    this.debloqueElements = debloques;
    this.parts = data;

    PARTS_KEYS.forEach((pk) => {
      this.categories[pk] = Array.from(new Set(this.parts[pk].map((item) => item.category)));
    });

    this.selectedParts = {
      head: this.resolvePartSrc('heads', avatar.tete, true),
      hat: this.resolvePartSrc('hats', avatar.chapeau, false),
      body: this.resolvePartSrc('bodies', avatar.corps, true),
      back: this.resolvePartSrc('backs', avatar.dos, false),
      add: this.resolvePartSrc('adds', avatar.add, false),
      front: this.resolvePartSrc('fronts', avatar.front, false),
    };

    this.refreshVisibleTabCategories();

    for (const sec of this.sections) {
      let cat = this.getCategoryFromPart(sec.partsKey, this.selectedParts[sec.slot]);
      if (sec.optionalEmpty && !this.selectedParts[sec.slot]) {
        cat = '';
      } else if (!cat && !sec.optionalEmpty) {
        cat = this.visibleTabCategories[sec.partsKey][0] ?? this.categories[sec.partsKey][0] ?? '';
      }
      this.selectedCategories[sec.partsKey] = cat;
      this.filterParts(sec.partsKey, cat);
    }

    for (const sec of this.sections) {
      if (!sec.optionalEmpty && this.filteredParts[sec.partsKey].length === 0 && this.parts[sec.partsKey].length > 0) {
        const fallback = this.visibleTabCategories[sec.partsKey][0] ?? this.categories[sec.partsKey][0];
        if (fallback) {
          this.filterParts(sec.partsKey, fallback);
        }
      }
    }

    this.savedPartsSnapshot = { ...this.selectedParts };
  }

  private reapplyFiltersAfterSnapshotRestore(): void {
    this.refreshVisibleTabCategories();
    for (const sec of this.sections) {
      let cat = this.getCategoryFromPart(sec.partsKey, this.selectedParts[sec.slot]);
      if (sec.optionalEmpty && !this.selectedParts[sec.slot]) {
        cat = '';
      } else if (!cat && !sec.optionalEmpty) {
        cat = this.visibleTabCategories[sec.partsKey][0] ?? this.categories[sec.partsKey][0] ?? '';
      }
      this.selectedCategories[sec.partsKey] = cat;
      this.filterParts(sec.partsKey, cat);
    }
  }

  private resolvePartSrc(partsKey: AvatarPartsKey, src: string | null | undefined, required: boolean): string {
    const s = (src ?? '').trim();
    const list = this.parts[partsKey];
    if (!list.length) {
      return '';
    }
    if (s && list.some((p) => p.src === s)) {
      return s;
    }
    if (!required) {
      return '';
    }
    const firstUnlocked = list.find((p) => this.isDebloquePiece(p));
    if (firstUnlocked) {
      return firstUnlocked.src;
    }
    return list[0].src;
  }

  private getCategoryFromPart(partType: AvatarPartsKey, partSrc: string): string {
    if (!partSrc) {
      return '';
    }
    const part = this.parts[partType].find((item) => item.src === partSrc);
    return part ? part.category : '';
  }

  private refreshVisibleTabCategories(): void {
    PARTS_KEYS.forEach((pk) => {
      const slot = this.partsKeyToSlot(pk);
      this.visibleTabCategories[pk] = this.buildVisibleCategories(pk, this.selectedParts[slot]);
    });
  }

  private partsKeyToSlot(partsKey: AvatarPartsKey): AvatarSlot {
    return PARTS_TO_SLOT[partsKey];
  }

  private buildVisibleCategories(partsKey: AvatarPartsKey, currentSrc: string): string[] {
    return this.categories[partsKey].filter((category) => {
      const inCat = this.parts[partsKey].filter((p) => p.category === category);
      if (currentSrc && inCat.some((p) => p.src === currentSrc)) {
        return true;
      }
      return inCat.some((p) => this.isDebloquePiece(p));
    });
  }
}
