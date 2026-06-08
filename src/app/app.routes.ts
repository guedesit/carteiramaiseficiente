import { Routes } from '@angular/router';
import { InterestListPageComponent } from './pages/interest-list-page.component';
import { AnalysisPageComponent } from './pages/analysis-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { LogsPageComponent } from './pages/logs-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePageComponent },
  { path: 'interest-list', component: InterestListPageComponent },
  { path: 'analysis', component: AnalysisPageComponent },
  { path: 'logs', component: LogsPageComponent },
  { path: '**', redirectTo: 'interest-list' },
];
