import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {CollectionComponent} from './collection/collection.component';
import { DeckbuilderComponent } from './deckbuilder/deckbuilder.component';
import { AccueilComponent } from './accueil/accueil.component';
import { RouterModule } from '@angular/router';
import { RechercheCombatComponent } from './recherche-combat/recherche-combat.component';
import { TournoisComponent } from './tournois/tournois.component';
import { ClassementsComponent } from './classements/classements.component';
import { MonCompteComponent } from './mon-compte/mon-compte.component';
import { DeconnexionComponent } from './deconnexion/deconnexion.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoginComponent } from './login/login.component';
import {HttpClientModule} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import {MultiSelectModule} from 'primeng/multiselect';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MenuComponent } from './menu/menu.component';
import {AuthGuard} from "./auth.guard";
import { SortCardsByNamePipe } from './pipes/sort-cards-by-name.pipe';
import {SseService} from "./services/sse.service";
import {ConfirmationService} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {MatIconModule} from '@angular/material/icon'
import {DropdownModule} from "primeng/dropdown";
import {DialogService, DynamicDialogModule} from 'primeng/dynamicdialog';
import { DemandeCombatDialogComponent } from './demande-combat-dialog/demande-combat-dialog.component';
import {DeckService} from "./services/deck.service";
import { PartieComponent } from './partie/partie.component';
import { CarteMainComponent } from './partie/carte-main/carte-main.component';
import { CarteTerrainComponent } from './partie/carte-terrain/carte-terrain.component';
import { PiocheComponent } from './partie/pioche/pioche.component';
import { DefausseComponent } from './partie/defausse/defausse.component';
import { CarteMainAdvComponent } from './partie/carte-main-adv/carte-main-adv.component';
import { SelectionCarteDialogComponent } from './partie/selection-carte-dialog/selection-carte-dialog.component';
import {VisionCartesDialogComponent} from "./partie/vision-cartes-dialog/vision-cartes-dialog.component";
import {MessagesModule} from "primeng/messages";
import {TableModule} from "primeng/table";
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import {DialogModule} from "primeng/dialog";
import { CommonModule } from "@angular/common";
import { AdministrationComponent } from './administration/administration.component';
import { CreateAccountComponent } from './administration/create-account/create-account.component';
import { CardManagementComponent } from './administration/card-management/card-management.component';
import { AttributionDeckComponent } from './administration/attribution-deck/attribution-deck.component';
import { DeckCardComponent } from './deckbuilder/deck-card/deck-card.component';
import { PampaButtonComponent } from './composants/pampa-button/pampa-button.component';
import { PampaSubmitButtonComponent } from './composants/pampa-submit-button/pampa-submit-button.component';
import { AdministrationPartiesComponent } from './administration/administration-parties/administration-parties.component';
import { PartieObsComponent } from './partie/partie-obs/partie-obs.component';
import { PampaButtonCarreComponent } from './composants/pampa-button-carre/pampa-button-carre.component';
import {PropertiesService} from "./services/properties.service";
import { PampaTourAnimationComponent } from './composants/pampa-tour-animation/pampa-tour-animation.component';
import { BoostersDetailsComponent } from './infos/boosters-details/boosters-details.component';
import { PampaOnOffComponent } from './composants/pampa-on-off/pampa-on-off.component';
import { BandeauFiltresCartesComponent } from './bandeau-filtres-cartes/bandeau-filtres-cartes.component';
import { PampaSortButtonsComponent } from './composants/pampa-sort-buttons/pampa-sort-buttons.component';
import {MatButtonModule} from "@angular/material/button";
import { CardViewComponent } from './card-view/card-view.component';
import { LimitationsDeckComponent } from './deckbuilder/limitations-deck/limitations-deck.component';
import { TchatComponent } from './composants/tchat/tchat.component';
import { InfosComponent } from './infos/infos.component';
import { DecksBaseDetailsComponent } from './infos/decks-base-details/decks-base-details.component';

@NgModule({
  declarations: [
    AppComponent,
    CollectionComponent,
    DeckbuilderComponent,
    AccueilComponent,
    RechercheCombatComponent,
    TournoisComponent,
    ClassementsComponent,
    MonCompteComponent,
    DeconnexionComponent,
    PageNotFoundComponent,
    LoginComponent,
    MenuComponent,
    SortCardsByNamePipe,
    DemandeCombatDialogComponent,
    PartieComponent,
    CarteMainComponent,
    CarteTerrainComponent,
    PiocheComponent,
    DefausseComponent,
    CarteMainAdvComponent,
    SelectionCarteDialogComponent,
    VisionCartesDialogComponent,
    ConfirmationDialogComponent,
    AdministrationComponent,
    CreateAccountComponent,
    CardManagementComponent,
    AttributionDeckComponent,
    DeckCardComponent,
    PampaButtonComponent,
    PampaSubmitButtonComponent,
    AdministrationPartiesComponent,
    PartieObsComponent,
    PampaButtonCarreComponent,
    PampaTourAnimationComponent,
    BoostersDetailsComponent,
    PampaOnOffComponent,
    BandeauFiltresCartesComponent,
    PampaSortButtonsComponent,
    CardViewComponent,
    LimitationsDeckComponent,
    TchatComponent,
    InfosComponent,
    DecksBaseDetailsComponent
  ],
  imports: [
    RouterModule.forRoot([
      {path: 'accueil', component: AccueilComponent},
      {path: 'collection', component: CollectionComponent, canActivate: [AuthGuard]},
      {path: 'deckbuilder', component: DeckbuilderComponent, canActivate: [AuthGuard]},
      {path: 'infos', component: InfosComponent, canActivate: [AuthGuard]},
      {path: 'infos/boosters-details', component: BoostersDetailsComponent, canActivate: [AuthGuard]},
      {path: 'infos/deck-base-details', component: DecksBaseDetailsComponent, canActivate: [AuthGuard]},
      {path: 'recherche-combat', component: RechercheCombatComponent, canActivate: [AuthGuard]},
      {path: 'partie/:id', component: PartieComponent, canActivate: [AuthGuard]},
      {path: 'partie-obs/:id', component: PartieObsComponent, canActivate: [AuthGuard]},
      {path: 'tournois', component: TournoisComponent, canActivate: [AuthGuard]},
      {path: 'classements', component: ClassementsComponent, canActivate: [AuthGuard]},
      {path: 'mon-compte', component: MonCompteComponent, canActivate: [AuthGuard]},
      {path: 'administration', component: AdministrationComponent, canActivate: [AuthGuard]},
      {path: 'create-account', component: CreateAccountComponent, canActivate: [AuthGuard]},
      {path: 'card-management', component: CardManagementComponent, canActivate: [AuthGuard]},
      {path: 'parties-management', component: AdministrationPartiesComponent, canActivate: [AuthGuard]},
      {path: 'attribution-deck', component: AttributionDeckComponent, canActivate: [AuthGuard]},
      {path: 'card-view/:id', component: CardViewComponent},
      {path: 'deconnexion', component: DeconnexionComponent},
      {path: '', redirectTo: '/accueil', pathMatch: 'full'},
      {path: '**', component: PageNotFoundComponent}
    ]),
    HttpClientModule,
    FormsModule,
    MultiSelectModule,
    BrowserModule,
    BrowserAnimationsModule,
    ConfirmDialogModule,
    DropdownModule,
    DynamicDialogModule,
    MessagesModule,
    TableModule,
    DialogModule,
    MatIconModule,
    CommonModule,
    MatButtonModule
  ],
  providers: [
    AuthGuard,
    SseService,
    ConfirmationService,
    DialogService,
    PropertiesService,
    DeckService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
