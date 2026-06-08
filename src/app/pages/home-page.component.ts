import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="home-shell">
      <div class="hero">
        <h1>Carteira Mais Eficiente</h1>
        <p>Analise ações com os métodos Graham e Bazin para montar uma carteira mais inteligente.</p>
      </div>

      <div class="feature-grid">
        <a routerLink="/interest-list" class="feature-card">
          <div class="feature-icon">📋</div>
          <h2>Minha Lista</h2>
          <p>Gerencie os ativos que você acompanha. Adicione ou remova tickers e sincronize no navegador.</p>
          <span class="cta">Acessar →</span>
        </a>

        <a routerLink="/analysis" class="feature-card">
          <div class="feature-icon">📊</div>
          <h2>Análise</h2>
          <p>Veja o preço justo, nota Graham, taxa Bazin e o potencial de valorização de cada ativo.</p>
          <span class="cta">Analisar →</span>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .home-shell {
      max-width: 860px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }

    .hero {
      text-align: center;
      margin-bottom: 3rem;
    }

    .hero h1 {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    .hero p {
      color: #666;
      font-size: 1.1rem;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 2rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .feature-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      border-color: #999;
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .feature-card h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .feature-card p {
      color: #555;
      font-size: 0.95rem;
      flex: 1;
    }

    .cta {
      font-weight: 600;
      color: #1a73e8;
      margin-top: 0.5rem;
    }
  `],
})
export class HomePageComponent {}
