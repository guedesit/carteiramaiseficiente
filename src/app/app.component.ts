import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <main class="layout">
      <header class="topbar">
        <h1>Carteira Mais Eficiente</h1>
        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Início</a>
          <a routerLink="/interest-list" routerLinkActive="active">Minha Lista</a>
          <a routerLink="/analysis" routerLinkActive="active">Analise</a>
        </nav>
      </header>
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {}
