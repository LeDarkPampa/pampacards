import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {CollectionComponent} from './collection/collection.component';
import { DeckbuilderComponent } from './deckbuilder/deckbuilder.component';
import { AccueilComponent } from './accueil/accueil.component';
import { RouterModule } from '@angular/router';
import { RechercheCombatComponent } from './recherche-combat/recherche-combat.component';
import { TournoisComponent } from './tournois/tournois.component';
import { MonCompteComponent } from './mon-compte/mon-compte.component';
import { DeconnexionComponent } from './deconnexion/deconnexion.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoginComponent } from './login/login.component';
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
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
import { DataManagementComponent } from './administration/data-management/data-management.component';
import { PampaIconButtonComponent } from './composants/pampa-icon-button/pampa-icon-button.component';
import {CanDeactivateGuard} from "./CanComponentDeactivate";
import { DetailsStatutsComponent } from './tutoriel/details-statuts/details-statuts.component';
import { TutorielComponent } from './tutoriel/tutoriel.component';
import { HowToPlayComponent } from './tutoriel/how-to-play/how-to-play.component';
import { HowToStartComponent } from './tutoriel/how-to-start/how-to-start.component';
import { CookieService } from 'ngx-cookie-service';
import { DetailsTournoiComponent } from './tournois/details-tournoi/details-tournoi.component';
import { DetailsLigueComponent } from './tournois/details-ligue/details-ligue.component';
import { AdministrationTournoisComponent } from './administration/administration-tournois/administration-tournois.component';
import { OpenAffrontementDialogComponent } from './tournois/open-affrontement-dialog/open-affrontement-dialog.component';
import {PartieService} from "./services/partie.service";
import {CarteEffetService} from "./services/carteEffet.service";
import {TchatService} from "./services/tchat.service";
import {TutoTournoisComponent} from "./tutoriel/tournois/tuto-tournois.component";
import {CarteComponent} from "./carte/carte.component";
import {LgAccueilComponent} from "./loup-garou/lg-accueil/lg-accueil.component";
import {LgJoinComponent} from "./loup-garou/lg-join/lg-join.component";
import {LgCreateComponent} from "./loup-garou/lg-create/lg-create.component";
import {LgGameComponent} from "./loup-garou/lg-game/lg-game.component";
import {InscriptionDialogComponent} from "./tournois/inscription-dialog/inscription-dialog.component";
import {CarteMainObsComponent} from "./partie/carte-main-obs/carte-main-obs.component";
import {AvatarBuilderComponent} from "./mon-compte/avatar-builder/avatar-builder.component";
import {AvatarViewComponent} from "./avatar-view/avatar-view.component";
import {AvatarService} from "./services/avatar.service";
import { DefisListComponent } from './mon-compte/defis-list/defis-list.component';

@NgModule({
  declarations: [
    AppComponent,
    CollectionComponent,
    DeckbuilderComponent,
    AccueilComponent,
    RechercheCombatComponent,
    TournoisComponent,
    MonCompteComponent,
    DeconnexionComponent,
    PageNotFoundComponent,
    LoginComponent,
    AvatarBuilderComponent,
    AvatarViewComponent,
    MenuComponent,
    SortCardsByNamePipe,
    DemandeCombatDialogComponent,
    PartieComponent,
    CarteMainComponent,
    CarteTerrainComponent,
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
    DecksBaseDetailsComponent,
    DataManagementComponent,
    PampaIconButtonComponent,
    DetailsStatutsComponent,
    TutorielComponent,
    HowToPlayComponent,
    HowToStartComponent,
    DetailsTournoiComponent,
    DetailsLigueComponent,
    AdministrationTournoisComponent,
    InscriptionDialogComponent,
    OpenAffrontementDialogComponent,
    CarteMainObsComponent,
    TutoTournoisComponent,
    LgAccueilComponent,
    LgJoinComponent,
    LgCreateComponent,
    LgGameComponent,
    CarteComponent,
    DefisListComponent
  ],
  bootstrap: [AppComponent], imports: [RouterModule.forRoot([
    {path: 'accueil', component: AccueilComponent},
    {path: 'login', component: LoginComponent},
    {path: 'collection', component: CollectionComponent, canActivate: [AuthGuard]},
    {
      path: 'deckbuilder',
      component: DeckbuilderComponent,
      canActivate: [AuthGuard],
      canDeactivate: [CanDeactivateGuard]
    },
    {path: 'tutoriel', component: TutorielComponent},
    {path: 'tutoriel/debuter', component: HowToStartComponent},
    {path: 'tutoriel/jouer', component: HowToPlayComponent},
    {path: 'tutoriel/details-statuts', component: DetailsStatutsComponent},
    {path: 'tutoriel/tournois', component: TutoTournoisComponent},
    {path: 'infos', component: InfosComponent},
    {path: 'infos/boosters-details', component: BoostersDetailsComponent},
    {path: 'infos/deck-base-details', component: DecksBaseDetailsComponent},
    {path: 'recherche-combat', component: RechercheCombatComponent, canActivate: [AuthGuard]},
    {path: 'partie/:id', component: PartieComponent, canActivate: [AuthGuard]},
    {path: 'partie-obs/:id/:type', component: PartieObsComponent, canActivate: [AuthGuard]},
    {path: 'tournois', component: TournoisComponent, canActivate: [AuthGuard]},
    {path: 'tournoi/:id', component: DetailsTournoiComponent, canActivate: [AuthGuard]},
    {path: 'ligue/:id', component: DetailsLigueComponent, canActivate: [AuthGuard]},
    {path: 'mon-compte', component: MonCompteComponent, canActivate: [AuthGuard]},
    {path: 'avatar-builder', component: AvatarBuilderComponent, canActivate: [AuthGuard]},
    {path: 'defis-list', component: DefisListComponent, canActivate: [AuthGuard]},
    {path: 'administration', component: AdministrationComponent, canActivate: [AuthGuard]},
    {path: 'create-account', component: CreateAccountComponent, canActivate: [AuthGuard]},
    {path: 'card-management', component: CardManagementComponent, canActivate: [AuthGuard]},
    {path: 'data-management', component: DataManagementComponent, canActivate: [AuthGuard]},
    {path: 'parties-management', component: AdministrationPartiesComponent, canActivate: [AuthGuard]},
    {path: 'attribution-deck', component: AttributionDeckComponent, canActivate: [AuthGuard]},
    {path: 'tournois-management', component: AdministrationTournoisComponent, canActivate: [AuthGuard]},
    {path: 'card-view/:id', component: CardViewComponent},
    {path: 'lg/accueil', component: LgAccueilComponent},
    {path: 'lg/create', component: LgCreateComponent},
    {path: 'lg/join', component: LgJoinComponent},
    {path: 'lg/game/:gameId/:playerId', component: LgGameComponent},
    {path: 'deconnexion', component: DeconnexionComponent},
    {path: '', redirectTo: '/accueil', pathMatch: 'full'},
    {path: '**', component: PageNotFoundComponent}
  ]),
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
    MatButtonModule,
    ReactiveFormsModule],
  providers: [
    AuthGuard,
    SseService,
    ConfirmationService,
    DialogService,
    PropertiesService,
    DeckService,
    CookieService,
    PartieService,
    TchatService,
    CarteEffetService,
    AvatarService,
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule { }
