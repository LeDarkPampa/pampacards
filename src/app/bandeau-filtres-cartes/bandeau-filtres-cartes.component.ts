import {
  Component,
  EventEmitter,
  Input, OnChanges,
  OnInit,
  Output, SimpleChanges
} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { AuthentificationService } from "../services/authentification.service";
import { ClanService } from "../services/clan.service";
import { TypeService } from "../services/type.service";
import { IClan } from "../interfaces/IClan";
import { IType } from "../interfaces/IType";
import { IFiltersAndSortsValues } from "../interfaces/IFiltersAndSortsValues";

@Component({
  selector: 'app-bandeau-filtres-cartes',
  templateUrl: './bandeau-filtres-cartes.component.html',
  styleUrls: ['./bandeau-filtres-cartes.component.css', '../app.component.css']
})
export class BandeauFiltresCartesComponent implements OnInit, OnChanges {
  @Input() filtersAndSortsValues: IFiltersAndSortsValues = {
    selectedClans: [],
    selectedTypes: [],
    selectedRaretes: [],
    sortValue: 'no'
  };

  @Output() applyFilters = new EventEmitter<IFiltersAndSortsValues>();
  @Output() sortCards = new EventEmitter<string>();

  clans: string[] = [];
  types: string[] = [];
  raretes: number[] = [1, 2, 3, 4];
  selectedClans: string[] = [];
  selectedTypes: string[] = [];
  selectedRaretes: number[] = [];
  resetSort: boolean = false;

  constructor(private http: HttpClient, private authService: AuthentificationService,
    private clanService: ClanService, private typeService: TypeService) {}

  ngOnInit() {
    this.initializeData();
  }

  ngOnChanges(changes: SimpleChanges) {
    // @ts-ignore
    if (changes.filtersAndSortsValues && !changes.filtersAndSortsValues.firstChange) {
      this.selectedClans = this.filtersAndSortsValues.selectedClans;
      this.selectedTypes = this.filtersAndSortsValues.selectedTypes;
      this.selectedRaretes = this.filtersAndSortsValues.selectedRaretes;
      this.resetSort = true;
    }
  }

  private initializeData() {
    this.clanService.getAllClans().subscribe(
      (clans: IClan[]) => {
        this.clans = clans.map(clan => clan.nom);
      },
      (error) => {
        console.error('Erreur lors de la récupération des clans', error);
      }
    );

    this.typeService.getAllTypes().subscribe(
      (types: IType[]) => {
        this.types = types.map(type => type.nom);
      },
      (error) => {
        console.error('Erreur lors de la récupération des types', error);
      }
    );
  }

  resetFilters() {
    this.selectedClans = [];
    this.selectedTypes = [];
    this.selectedRaretes = [];
    this.resetSort = true;

    this.applyFiltersCards();
  }

  emitSortEvent(sortValue: string) {
    this.filtersAndSortsValues.sortValue = sortValue;
    setTimeout(() => {
      this.resetSort = false;
      this.applyFiltersCards();
    });
  }

  applyFiltersCards() {
    this.filtersAndSortsValues.selectedClans = this.selectedClans;
    this.filtersAndSortsValues.selectedTypes = this.selectedTypes;
    this.filtersAndSortsValues.selectedRaretes = this.selectedRaretes;
    this.applyFilters.emit(this.filtersAndSortsValues);
  }
}
