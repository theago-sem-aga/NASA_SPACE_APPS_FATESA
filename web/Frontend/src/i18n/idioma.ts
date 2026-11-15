import { useSyncExternalStore } from 'react';
import type { Local } from '../api/tipos';

// Idioma da interface. Inglês é o principal (os dados de referência da apresentação são
// em boa parte dos EUA); português é opcional, escolhido pela bandeira no cabeçalho.
// A escolha fica guardada no navegador (só conveniência; sem ela, volta ao inglês).

export type Idioma = 'en' | 'pt';
export const IDIOMA_PADRAO: Idioma = 'en';
const CHAVE = 'fatesa-idioma';

function lerGuardado(): Idioma {
  try {
    const v = window.localStorage.getItem(CHAVE);
    if (v === 'en' || v === 'pt') return v;
  } catch {
    /* navegador sem armazenamento: usa o padrão */
  }
  return IDIOMA_PADRAO;
}

let atual: Idioma = typeof window === 'undefined' ? IDIOMA_PADRAO : lerGuardado();
const ouvintes = new Set<() => void>();

function aplicarNoDocumento(i: Idioma) {
  if (typeof document !== 'undefined') document.documentElement.lang = i === 'pt' ? 'pt-BR' : 'en';
}
aplicarNoDocumento(atual);

export function idiomaAtual(): Idioma {
  return atual;
}

export function mudarIdioma(i: Idioma) {
  if (i === atual) return;
  atual = i;
  try {
    window.localStorage.setItem(CHAVE, i);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  aplicarNoDocumento(i);
  ouvintes.forEach(f => f());
}

/** Componente que chama isto volta a desenhar quando o idioma muda (o App chama, e a árvore toda segue). */
export function useIdioma(): Idioma {
  return useSyncExternalStore(
    f => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    idiomaAtual,
    () => IDIOMA_PADRAO
  );
}

/** Texto nos dois idiomas; devolve o do idioma atual. */
export const tx = (pt: string, en: string): string => (atual === 'pt' ? pt : en);

/** Locale para números e datas. */
export const localeAtual = (): string => (atual === 'pt' ? 'pt-BR' : 'en-US');

/** Os contratos científicos permanecem em Celsius; a conversão é de apresentação. */
export function temperatura(celsius: number, casas = 1): string {
  const valor = atual === 'en' ? celsius * 9 / 5 + 32 : celsius;
  return `${valor.toLocaleString(localeAtual(), { maximumFractionDigits: casas })} ${atual === 'en' ? '°F' : '°C'}`;
}

/** Diferenças de temperatura não recebem o deslocamento de 32 graus. */
export function diferencaTemperatura(celsius: number): string {
  const valor = atual === 'en' ? celsius * 9 / 5 : celsius;
  return `${valor.toLocaleString(localeAtual(), { maximumFractionDigits: 1 })} ${atual === 'en' ? '°F' : '°C'}`;
}

const ESTADOS_EUA = new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR'.split(' '));

/** Só troca ao escolher ou confirmar um local identificado, permitindo troca manual depois. */
export function aplicarIdiomaDoLocal(local: Local | null) {
  if (!local) return;
  if (/^\d{7}$/.test(local.codigo_ibge)) mudarIdioma('pt');
  else if (!local.codigo_ibge && ESTADOS_EUA.has(local.uf)) mudarIdioma('en');
}

/** Voz da narração. */
export const vozAtual = (): string => (atual === 'pt' ? 'pt-BR' : 'en-US');

// ---------------------------------------------------------------------------
// Tabelas de rótulos: L('pt', 'en') marca um texto; traduzivel() troca cada marca por um
// getter que lê o idioma atual. Assim ROTULO_X[chave].nome continua funcionando igual.

const MARCA = Symbol('bilingue');
type Marca = { [MARCA]: true; pt: string; en: string };

/** Texto bilíngue dentro de uma tabela passada a traduzivel(). Tipado como string. */
export function L(pt: string, en: string): string {
  return { [MARCA]: true, pt, en } as unknown as string;
}

function ehMarca(v: unknown): v is Marca {
  return typeof v === 'object' && v !== null && MARCA in v;
}

export function traduzivel<T>(obj: T): T {
  if (ehMarca(obj)) {
    const m = obj;
    return m as unknown as T; // tratado pelo pai
  }
  if (Array.isArray(obj)) {
    const saida: unknown[] = [];
    obj.forEach((v, i) => {
      if (ehMarca(v)) Object.defineProperty(saida, i, { get: () => tx(v.pt, v.en), enumerable: true });
      else saida[i] = traduzivel(v);
    });
    return saida as unknown as T;
  }
  if (typeof obj === 'object' && obj !== null) {
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (ehMarca(v)) Object.defineProperty(saida, k, { get: () => tx(v.pt, v.en), enumerable: true });
      else saida[k] = traduzivel(v);
    }
    return saida as T;
  }
  return obj;
}

export const MESES_LONGOS = traduzivel([
  L('janeiro', 'January'), L('fevereiro', 'February'), L('março', 'March'), L('abril', 'April'),
  L('maio', 'May'), L('junho', 'June'), L('julho', 'July'), L('agosto', 'August'),
  L('setembro', 'September'), L('outubro', 'October'), L('novembro', 'November'), L('dezembro', 'December')
]);

export const MESES_CURTOS = traduzivel([
  L('jan', 'Jan'), L('fev', 'Feb'), L('mar', 'Mar'), L('abr', 'Apr'), L('mai', 'May'), L('jun', 'Jun'),
  L('jul', 'Jul'), L('ago', 'Aug'), L('set', 'Sep'), L('out', 'Oct'), L('nov', 'Nov'), L('dez', 'Dec')
]);
