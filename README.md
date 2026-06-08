# Carteira Mais Eficiente (Angular)

Aplicacao Angular standalone para analise de acoes por Graham + Bazin, com lista de interesse persistida no navegador.

## Funcionalidades

- Pagina 1: Minha Lista de Interesse
- Adicao por ticker com autocomplete
- Persistencia imediata em localStorage (`carteira_eficiente_interest_list_v1`)
- Pagina 2: Analise Graham + Bazin
- Preco atual, preco justo de Graham, preco teto de Bazin
- Potencial de valorizacao e margem de seguranca
- Separacao em lista principal e quarentena
- Grafico de barras de preco atual vs preco-alvo
- Filtros e ordenacao
- Tolerancia a erro parcial por acao

## Configuracao

Ajuste os valores em:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

Campos principais:

- `apiMode`: `internal` ou `external`
- `userId`: usado no modo `internal`
- `apiBaseUrl`: backend Laravel
- `brapiToken`: token BRAPI para modo `external`

## Execucao

```bash
npm install
npm start
```

A aplicacao abre em `http://localhost:4200`.

## Testes

```bash
npm test
```

Cobertura minima entregue:

- `src/app/services/valuation.service.spec.ts`
- `src/app/services/interest-list.service.spec.ts`
