// Pictogramas próprios (sem direitos de terceiros) para quem lê pouco:
// toda escolha e todo resultado importante tem imagem + palavra curta.
// Estilo: formas chapadas, cores da terra, fundo suave. Sempre usar ao lado de texto.
import type { ReactNode } from 'react';

const C = {
  folha: '#3f7d4e', mata: '#1f4d2c', terra: '#b9844f', terraEscura: '#7a4f25', terraClara: '#e3c49c',
  palha: '#dcc27a', agua: '#2b5f8a', sol: '#e0b93a', cinza: '#4a554d', alerta: '#a14b0b'
};

const FUNDO = {
  verde: '#e7efe2', terra: '#f6ebdd', azul: '#e5eef6', amarelo: '#faf1d8', cinza: '#eceee9', vermelho: '#f8e4da'
};

type Def = { fundo: keyof typeof FUNDO; desenho: ReactNode };

const solo = (y = 30, cor = C.terra) => <rect x="4" y={y} width="40" height={44 - y} rx="3" fill={cor} />;
const gotas = (
  <path d="M14 8l-2 5M24 5l-2 5M34 8l-2 5" stroke={C.agua} strokeWidth="2.5" strokeLinecap="round" />
);
const inseto = (
  <>
    <ellipse cx="24" cy="27" rx="8" ry="10" fill={C.cinza} />
    <circle cx="24" cy="15" r="4.5" fill={C.cinza} />
    <path d="M16 22l-6-3M16 28h-7M16 34l-6 3M32 22l6-3M32 28h7M32 34l6 3M22 11l-3-4M26 11l3-4" stroke={C.cinza} strokeWidth="2" strokeLinecap="round" />
    <path d="M24 18v19" stroke="#fff" strokeWidth="1.5" />
  </>
);
const moeda = (
  <>
    <circle cx="24" cy="24" r="15" fill={C.sol} stroke="#a8861c" strokeWidth="2.5" />
    <text x="24" y="29.5" textAnchor="middle" fontSize="14" fontWeight="700" fill="#6e5410" fontFamily="sans-serif">R$</text>
  </>
);
const gota = <path d="M24 7C17 17 13 23 13 29a11 11 0 0 0 22 0c0-6-4-12-11-22z" fill={C.agua} />;

const DEFS: Record<string, Def> = {
  // ---------- culturas ----------
  cana: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M18 43V9M29 43V7" stroke={C.folha} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M15 19h6M15 30h6M26 17h6M26 28h6" stroke={C.mata} strokeWidth="2" />
        <path d="M18 13c-4-3-8-3-12-1M29 11c5-4 9-4 13-2M29 22c4-2 8-1 11 1M18 24c-4-1-7 0-9 2" stroke={C.folha} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  },
  soja: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M13 37C10 27 17 14 31 9c5 10-1 24-14 29z" fill="#a9c46a" stroke="#5c7a2a" strokeWidth="2" />
        <circle cx="18" cy="31" r="3" fill="#e2ebb8" />
        <circle cx="22" cy="24" r="3" fill="#e2ebb8" />
        <circle cx="26" cy="17" r="3" fill="#e2ebb8" />
        <path d="M33 30c4-3 8-3 10 0-3 3-7 3-10 0zM33 30l-4 10" stroke={C.folha} strokeWidth="2" fill={C.folha} />
      </>
    )
  },
  milho: {
    fundo: 'amarelo',
    desenho: (
      <>
        <ellipse cx="24" cy="21" rx="7.5" ry="13" fill="#eac54a" stroke="#a8861c" strokeWidth="2" />
        <path d="M19 13h10M17.5 18h13M17 23h14M17.5 28h13M20 33h8M24 9v24" stroke="#a8861c" strokeWidth="1.3" />
        <path d="M16 24c-5 7-4 14 3 19M32 24c5 7 4 14-3 19" stroke={C.folha} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    )
  },
  mandioca: {
    fundo: 'terra',
    desenho: (
      <>
        <path d="M22 17c-6 5-9 13-11 24 7-3 11-11 12-23z" fill={C.terraEscura} />
        <path d="M26 17c6 6 9 13 11 24-7-3-11-11-12-23z" fill={C.terraEscura} />
        <path d="M24 18c-2 8-1 16 0 25 2-9 2-17 0-25z" fill={C.terra} />
        <path d="M24 18L15 6l6 2zM24 18V4l3 5zM24 18l10-11-2 6z" fill={C.folha} />
      </>
    )
  },
  milheto: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M17 44V16M24 44V10M31 44V16" stroke={C.folha} strokeWidth="3" strokeLinecap="round" />
        <rect x="14" y="5" width="6" height="14" rx="3" fill="#b9a25a" />
        <rect x="21" y="2" width="6" height="14" rx="3" fill="#b9a25a" />
        <rect x="28" y="5" width="6" height="14" rx="3" fill="#b9a25a" />
        <path d="M17 30c-5-2-9-1-12 2M31 28c5-2 9-1 12 2M24 34c-4-1-7 0-9 2" stroke={C.folha} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  },
  sorgo_forrageiro: {
    fundo: 'terra',
    desenho: (
      <>
        <path d="M24 44V18" stroke={C.folha} strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="24" cy="12" rx="8" ry="9" fill="#a5452c" />
        <g fill="#c8614a"><circle cx="20" cy="9" r="2.4" /><circle cx="27" cy="8" r="2.4" /><circle cx="22" cy="15" r="2.4" /><circle cx="28" cy="14" r="2.4" /></g>
        <path d="M24 28c-6-3-11-2-15 2M24 34c6-3 11-2 15 2" stroke={C.folha} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    )
  },
  mucuna: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M8 40c8-4 10-14 18-16s12-10 14-18" stroke={C.folha} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <g fill={C.folha}><ellipse cx="14" cy="34" rx="5" ry="3" transform="rotate(-30 14 34)" /><ellipse cx="28" cy="22" rx="5" ry="3" transform="rotate(-30 28 22)" /><ellipse cx="38" cy="10" rx="5" ry="3" transform="rotate(-30 38 10)" /></g>
        <path d="M20 26c-2 6-1 11 3 14" stroke="#4b3a5a" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M33 16c-1 6 1 10 5 12" stroke="#4b3a5a" strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    )
  },
  trigo: {
    fundo: 'amarelo',
    desenho: (
      <>
        <path d="M24 44V8" stroke="#a8861c" strokeWidth="2.5" strokeLinecap="round" />
        {[12, 18, 24, 30].map(y => (
          <g key={y} fill="#d9b65c">
            <ellipse cx="19.5" cy={y} rx="3" ry="5.5" transform={`rotate(-35 19.5 ${y})`} />
            <ellipse cx="28.5" cy={y} rx="3" ry="5.5" transform={`rotate(35 28.5 ${y})`} />
          </g>
        ))}
        <ellipse cx="24" cy="7" rx="2.5" ry="4.5" fill="#d9b65c" />
      </>
    )
  },
  pastagem: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M8 40c1-8 3-14 3-22M14 40c0-8 2-15 7-21M20 40c0-6-2-12-6-16M27 40c1-9 4-16 10-22M33 40c0-7-2-12-5-16M39 40c1-6 3-10 6-13" stroke={C.folha} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M4 41h40" stroke={C.terraEscura} strokeWidth="3" strokeLinecap="round" />
      </>
    )
  },
  amendoim: {
    fundo: 'terra',
    desenho: (
      <g transform="rotate(-30 24 24)">
        <circle cx="24" cy="15.5" r="8.5" fill="#d9a86c" stroke={C.terraEscura} strokeWidth="2" />
        <circle cx="24" cy="32" r="8.5" fill="#d9a86c" stroke={C.terraEscura} strokeWidth="2" />
        <path d="M18 23.7h12" stroke="#d9a86c" strokeWidth="5" />
        <path d="M20 12h8M19 17h10M19 29h10M20 34h8" stroke={C.terraEscura} strokeWidth="1.3" strokeDasharray="2 2" />
      </g>
    )
  },
  crotalaria: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M15 44V22M25 44V14M35 44V24" stroke={C.folha} strokeWidth="3" strokeLinecap="round" />
        <path d="M15 32c-4-2-6-1-8 1M25 26c4-2 7-2 9 0M35 34c3-2 6-2 8 0" stroke={C.folha} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[[15, 17, 4.5], [25, 9.5, 4.5], [35, 19, 4.5], [20, 21, 3], [30, 14, 3]].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={C.sol} />
        ))}
      </>
    )
  },
  terra_descoberta: {
    fundo: 'terra',
    desenho: (
      <>
        {gotas}
        {solo(24)}
        <path d="M6 30h36M6 36h36" stroke={C.terraEscura} strokeWidth="2" />
        <path d="M20 24l3 7 3-7" fill={C.terraEscura} />
      </>
    )
  },
  palhada: {
    fundo: 'amarelo',
    desenho: (
      <>
        {solo(32)}
        <path d="M5 29l13-4M13 31l15-3M23 28l15 3M30 31l13-5M7 25l11 2M28 25l10-2" stroke={C.palha} strokeWidth="3.2" strokeLinecap="round" />
      </>
    )
  },

  // Verdor da planta (estresse vegetal, NDVI do satélite).
  planta: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M24 41V20" stroke={C.folha} strokeWidth="3" strokeLinecap="round" />
        <path d="M24 25c-9 0-14-6-14-15 9 0 14 6 14 15z" fill={C.folha} />
        <path d="M24 31c8 0 13-5 13-13-8 0-13 5-13 13z" fill={C.mata} />
        <path d="M12 41h24" stroke={C.terraEscura} strokeWidth="3" strokeLinecap="round" />
      </>
    )
  },

  // ---------- prioridades / atributos ----------
  segurar_solo: {
    fundo: 'terra',
    desenho: (
      <>
        {solo(26)}
        <path d="M24 26V11" stroke={C.folha} strokeWidth="3" strokeLinecap="round" />
        <path d="M24 15c-5 0-8-3-8-7 5 0 8 3 8 7zM24 20c5 0 8-3 8-7-5 0-8 3-8 7z" fill={C.folha} />
        <path d="M24 26v14M24 30l-7 6M24 30l7 6M24 35l-10 4M24 35l10 4" stroke="#f6ebdd" strokeWidth="2" strokeLinecap="round" />
      </>
    )
  },
  terra_forte: {
    fundo: 'terra',
    desenho: (
      <>
        <rect x="4" y="20" width="40" height="9" rx="2" fill="#5a3a1e" />
        {solo(29)}
        <path d="M14 20c0-5 3-8 7-8 0 5-3 8-7 8zM30 20c0-4-2-7-6-7 0 4 2 7 6 7z" fill={C.folha} />
        <path d="M10 36c3-2 5 2 8 0s5 2 8 0" stroke="#d98b8b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
  },
  nitrogenio: {
    fundo: 'azul',
    desenho: (
      <>
        <path d="M18 8v14M18 22l-7 10M18 22l7 10M18 28v12" stroke={C.terraEscura} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="31" r="2.6" fill="#d98b8b" />
        <circle cx="24" cy="31" r="2.6" fill="#d98b8b" />
        <circle cx="18" cy="38" r="2.6" fill="#d98b8b" />
        <circle cx="34" cy="14" r="8" fill={C.agua} />
        <text x="34" y="18.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="sans-serif">N</text>
      </>
    )
  },
  seca: {
    fundo: 'amarelo',
    desenho: (
      <>
        <circle cx="34" cy="13" r="6.5" fill={C.sol} />
        <path d="M34 3v2M34 21v2M24 13h2M42 13h2M27 6l1.5 1.5M39.5 18.5L41 20M41 6l-1.5 1.5" stroke={C.sol} strokeWidth="2" strokeLinecap="round" />
        <path d="M17 12C12 20 9 25 9 30a8 8 0 0 0 16 0c0-5-3-10-8-18z" fill={C.agua} />
      </>
    )
  },
  renda: { fundo: 'amarelo', desenho: moeda },
  chuva: {
    fundo: 'azul',
    desenho: (
      <>
        <path d="M13 27a7 7 0 0 1 1-14 10 10 0 0 1 19-2 8 8 0 0 1 2 16z" fill={C.agua} />
        <path d="M16 32l-2 6M24 32l-2 7M32 32l-2 6" stroke={C.agua} strokeWidth="3" strokeLinecap="round" />
      </>
    )
  },
  calor: {
    fundo: 'vermelho',
    desenho: (
      <>
        <rect x="19" y="6" width="10" height="27" rx="5" fill="#fff" stroke={C.alerta} strokeWidth="2.5" />
        <circle cx="24" cy="35" r="8" fill={C.alerta} />
        <rect x="21.5" y="15" width="5" height="20" fill={C.alerta} />
        <path d="M34 12h6M34 19h4M34 26h6" stroke={C.alerta} strokeWidth="2" strokeLinecap="round" />
      </>
    )
  },
  geada: {
    fundo: 'azul',
    desenho: (
      <>
        <path
          d="M24 5v34M7.5 14.5l33 19M7.5 33.5l33-19M24 5l-4 4M24 5l4 4M24 39l-4-4M24 39l4-4M7.5 14.5l5.5 1M7.5 14.5l1.5-5.5M40.5 33.5l-5.5-1M40.5 33.5l-1.5 5.5M7.5 33.5l1.5 5.5M7.5 33.5l5.5-1M40.5 14.5l-1.5-5.5M40.5 14.5l-5.5 1"
          stroke={C.agua}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="24" cy="22" r="3.5" fill="#fff" stroke={C.agua} strokeWidth="2" />
      </>
    )
  },
  saco: {
    fundo: 'amarelo',
    desenho: (
      <>
        <path d="M17 10h14l-3 6c7 4 10 12 9 21-1 4-25 4-26 0-1-9 2-17 9-21z" fill={C.palha} stroke="#a8861c" strokeWidth="2" />
        <path d="M18 10h12" stroke="#a8861c" strokeWidth="3" strokeLinecap="round" />
      </>
    )
  },
  gado: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M14 14l-7-5M34 14l7-5" stroke={C.cinza} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="11" cy="19" rx="5" ry="3" fill="#fff" stroke={C.cinza} strokeWidth="2" />
        <ellipse cx="37" cy="19" rx="5" ry="3" fill="#fff" stroke={C.cinza} strokeWidth="2" />
        <rect x="14" y="11" width="20" height="28" rx="10" fill="#fff" stroke={C.cinza} strokeWidth="2.5" />
        <ellipse cx="20" cy="18" rx="3.5" ry="4.5" fill={C.cinza} />
        <rect x="16" y="29" width="16" height="10" rx="5" fill="#e8b8a8" />
        <circle cx="21" cy="34" r="1.3" fill={C.cinza} />
        <circle cx="27" cy="34" r="1.3" fill={C.cinza} />
        <circle cx="20" cy="24" r="1.6" fill={C.cinza} />
        <circle cx="28" cy="24" r="1.6" fill={C.cinza} />
      </>
    )
  },
  agua: { fundo: 'azul', desenho: gota },
  quebra_pragas: {
    fundo: 'vermelho',
    desenho: (
      <>
        {inseto}
        <path d="M10 40L38 8" stroke={C.alerta} strokeWidth="4" strokeLinecap="round" />
      </>
    )
  },
  trabalho: {
    fundo: 'cinza',
    desenho: (
      <>
        <circle cx="24" cy="24" r="12" fill="none" stroke={C.cinza} strokeWidth="6" strokeDasharray="4.2 4.2" />
        <circle cx="24" cy="24" r="9.5" fill={C.cinza} />
        <circle cx="24" cy="24" r="4" fill={FUNDO.cinza} />
      </>
    )
  },

  // ---------- talhão ----------
  arenosa: {
    fundo: 'terra',
    desenho: (
      <>
        {solo(14, '#e9cf9c')}
        {[[10, 20], [18, 24], [27, 19], [36, 23], [13, 31], [23, 33], [32, 30], [39, 36], [9, 39], [19, 40], [29, 39]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#a8803f" />
        ))}
      </>
    )
  },
  media: {
    fundo: 'terra',
    desenho: (
      <>
        {solo(14, '#c99a62')}
        {[[11, 21], [27, 20], [17, 33], [35, 32]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4" ry="3" fill="#8f5f2d" />)}
        {[[20, 24], [36, 22], [10, 38], [26, 39]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#8f5f2d" />)}
      </>
    )
  },
  argilosa: {
    fundo: 'terra',
    desenho: (
      <>
        {solo(14, '#a24f2c')}
        {[[13, 22], [30, 21], [20, 33], [36, 35]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="7" ry="4.5" fill="#7a3519" />)}
      </>
    )
  },
  plano: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M4 30h40v14H4z" fill={C.terra} />
        <path d="M4 30h40" stroke={C.folha} strokeWidth="3" />
        <path d="M24 30V20M24 24c-3 0-5-2-5-5 3 0 5 2 5 5z" stroke={C.folha} strokeWidth="2" fill={C.folha} />
      </>
    )
  },
  suave_ondulado: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M4 36L44 24v20H4z" fill={C.terra} />
        <path d="M4 36L44 24" stroke={C.folha} strokeWidth="3" />
        <path d="M26 30V20M26 24c-3 0-5-2-5-5 3 0 5 2 5 5z" stroke={C.folha} strokeWidth="2" fill={C.folha} />
      </>
    )
  },
  ondulado: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M4 42L44 12v32H4z" fill={C.terra} />
        <path d="M4 42L44 12" stroke={C.folha} strokeWidth="3" />
        <path d="M14 30l-6 6M22 24l-6 6" stroke={C.agua} strokeWidth="2.5" strokeLinecap="round" />
      </>
    )
  },
  certeza: {
    fundo: 'verde',
    desenho: (
      <>
        <path d="M17 30l-4 12 6-3 5 4 2-11M31 30l4 12-6-3-5 4" fill={C.palha} stroke={C.terraEscura} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="24" cy="20" r="13" fill={C.sol} stroke={C.terraEscura} strokeWidth="2" />
        <circle cx="24" cy="20" r="8.5" fill="none" stroke={C.terraEscura} strokeWidth="1.2" strokeDasharray="2 2" />
        <path d="M19.5 20.5l3 3 6-6.5" fill="none" stroke={C.mata} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  },
  nao_sei: {
    fundo: 'cinza',
    desenho: (
      <>
        <circle cx="24" cy="24" r="15" fill="none" stroke={C.cinza} strokeWidth="2.5" />
        <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="700" fill={C.cinza} fontFamily="sans-serif">?</text>
      </>
    )
  },

  // ---------- problemas ----------
  erosao: {
    fundo: 'terra',
    desenho: (
      <>
        {gotas}
        <path d="M4 20h13l7 16 7-16h13v24H4z" fill={C.terra} />
        <path d="M20.5 28l3.5 8 3.5-8" fill={C.agua} />
      </>
    )
  },
  falta_agua: {
    fundo: 'amarelo',
    desenho: (
      <>
        <circle cx="24" cy="12" r="7" fill={C.sol} />
        {solo(26, '#d2a56d')}
        <path d="M10 26l4 6-3 5 2 7M26 26l-2 7 4 4-1 7M36 26l3 5-2 6" stroke={C.terraEscura} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      </>
    )
  },
  solo_cansado: {
    fundo: 'terra',
    desenho: (
      <>
        {solo(32)}
        <path d="M24 32c0-8 0-12 4-17" stroke="#8a8f5a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M28 15c-5 1-8 4-8 9M27 21c4 1 6 4 6 8" stroke="#a7a86a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M8 10l8 6 6-4 8 8" stroke={C.alerta} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  },
  pragas: { fundo: 'vermelho', desenho: inseto },
  preco_baixo: {
    fundo: 'amarelo',
    desenho: (
      <>
        <g transform="translate(-5 0) scale(0.85)">{moeda}</g>
        <path d="M38 12v20M32 26l6 7 6-7" stroke={C.alerta} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  },

  // ---------- recursos ----------
  trator: {
    fundo: 'cinza',
    desenho: (
      <>
        <rect x="18" y="10" width="12" height="12" rx="2" fill="none" stroke={C.mata} strokeWidth="2.5" />
        <path d="M8 22h30v8H8z" fill={C.folha} />
        <circle cx="15" cy="34" r="8" fill={C.cinza} />
        <circle cx="15" cy="34" r="3" fill="#ddd" />
        <circle cx="36" cy="36" r="5" fill={C.cinza} />
        <path d="M34 22V12" stroke={C.cinza} strokeWidth="2.5" />
      </>
    )
  },
  silo: {
    fundo: 'cinza',
    desenho: (
      <>
        <path d="M10 18a8 8 0 0 1 16 0v24H10z" fill="#c9ced2" stroke={C.cinza} strokeWidth="2" />
        <path d="M10 26h16M10 34h16" stroke={C.cinza} strokeWidth="1.5" />
        <path d="M28 30h12v12H28z" fill={C.sol} stroke="#a8861c" strokeWidth="2" />
        <path d="M30 30l4-6 4 6" fill="#d9b65c" />
      </>
    )
  },
  irrigacao: {
    fundo: 'azul',
    desenho: (
      <>
        <path d="M24 44V24" stroke={C.cinza} strokeWidth="3" />
        <path d="M18 24h12" stroke={C.cinza} strokeWidth="3" strokeLinecap="round" />
        <path d="M24 20C18 14 12 14 7 18M24 20c6-6 12-6 17-2M24 18c0-6 0-10 0-12" stroke={C.agua} strokeWidth="2" fill="none" strokeDasharray="2.5 3" strokeLinecap="round" />
        <path d="M4 44h40" stroke={C.terra} strokeWidth="4" />
      </>
    )
  }
};

export type NomePictograma = keyof typeof DEFS;

/** Mapa de cultura_id (e etapas especiais da rotação) para pictograma. */
export const PICTOGRAMA_CULTURA: Record<string, NomePictograma> = {
  cana_de_acucar: 'cana',
  soja: 'soja',
  milho: 'milho',
  mandioca: 'mandioca',
  milheto: 'milheto',
  sorgo_forrageiro: 'sorgo_forrageiro',
  mucuna: 'mucuna',
  trigo: 'trigo',
  pastagem: 'pastagem',
  amendoim: 'amendoim',
  crotalaria: 'crotalaria',
  pousio: 'terra_descoberta',
  palhada: 'palhada'
};

export function Pictograma({ nome, tamanho = 48, semFundo = false }: { nome: NomePictograma; tamanho?: number; semFundo?: boolean }) {
  const def = DEFS[nome] ?? DEFS.nao_sei;
  return (
    <svg aria-hidden="true" focusable="false" width={tamanho} height={tamanho} viewBox="0 0 48 48" className="pictograma">
      {!semFundo && <rect width="48" height="48" rx="11" fill={FUNDO[def.fundo]} />}
      {def.desenho}
    </svg>
  );
}
