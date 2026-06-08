import { Routes } from '@angular/router';
import { InterestListPageComponent } from './pages/interest-list-page.component';
import { AnalysisPageComponent } from './pages/analysis-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'interest-list' },
  { path: 'interest-list', component: InterestListPageComponent },
  { path: 'analysis', component: AnalysisPageComponent },
  { path: '**', redirectTo: 'interest-list' },
];
