// Narração opcional (botão "Ouvir"). Usa a síntese de voz do navegador; não
// captura microfone. As vozes "Google" (Chrome) e "Online (Natural)" (Edge) são
// do próprio navegador e podem precisar de internet; sem elas, usa a voz do aparelho.
//
// Cuidados que resolvem a fala que parava no meio ou soava estranha:
// 1. O Chrome corta uma fala longa depois de uns 15 segundos. Por isso o texto é
//    quebrado em frases e falado uma de cada vez, em fila.
// 2. Sem escolher a voz, o navegador usa a voz padrão do sistema. Num Windows em
//    português, o inglês sai com sotaque de português (e vice-versa). Por isso a voz
//    é escolhida pelo idioma da tela, preferindo as vozes mais naturais.
// 3. A lista de vozes carrega depois da página. Se ainda estiver vazia, espera ela
//    chegar (até 2 s) antes de falar, em vez de cair na voz padrão.
import { useCallback, useEffect, useRef, useState } from 'react';
import { tx, vozAtual } from '../i18n/idioma';

const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Quebra em frases curtas, sem separar números como "5,5" nem abreviações comuns. */
export function quebrarEmFrases(texto: string): string[] {
  return texto
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"“])/)
    .map(f => f.trim())
    .filter(Boolean);
}

const langDe = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();

/**
 * Melhor voz para o idioma da tela (en-US ou pt-BR), da mais natural para a mais simples:
 * Google do idioma exato → Microsoft "Online (Natural)" do idioma exato → qualquer voz do
 * idioma exato → outra variante do mesmo idioma (en-GB, pt-PT). Nunca uma voz de outro idioma.
 */
export function escolherVoz(vozes: SpeechSynthesisVoice[], alvo: string): SpeechSynthesisVoice | null {
  const exato = alvo.toLowerCase();
  const prefixo = exato.slice(0, 2);
  const doIdioma = vozes.filter(v => langDe(v) === exato);
  const daFamilia = vozes.filter(v => langDe(v).startsWith(prefixo));
  return (
    doIdioma.find(v => /google/i.test(v.name)) ??
    doIdioma.find(v => /natural|online/i.test(v.name)) ??
    doIdioma.find(v => v.localService) ??
    doIdioma[0] ??
    daFamilia.find(v => /google/i.test(v.name)) ??
    daFamilia.find(v => /natural|online/i.test(v.name)) ??
    daFamilia[0] ??
    null
  );
}

/** Lista de vozes; se ainda não carregou, espera o evento (no máximo 2 s). */
function esperarVozes(): Promise<SpeechSynthesisVoice[]> {
  const ja = window.speechSynthesis.getVoices();
  if (ja.length > 0) return Promise.resolve(ja);
  return new Promise(resolve => {
    const pronto = () => {
      window.clearTimeout(limite);
      window.speechSynthesis.removeEventListener('voiceschanged', pronto);
      resolve(window.speechSynthesis.getVoices());
    };
    const limite = window.setTimeout(pronto, 2000);
    window.speechSynthesis.addEventListener('voiceschanged', pronto);
  });
}

export function useNarracao() {
  const [falando, setFalando] = useState(false);
  /** Aviso quando o aparelho não tem voz no idioma da tela (em vez de ler com sotaque errado). */
  const [aviso, setAviso] = useState<string | null>(null);
  // Guarda a fila: no Chrome, uma fala sem referência pode ser descartada e não avisar o fim.
  const fila = useRef<SpeechSynthesisUtterance[]>([]);
  const sessao = useRef(0);

  useEffect(() => {
    // Pede a lista cedo: em alguns navegadores ela só começa a carregar na primeira chamada.
    if (suportado) window.speechSynthesis.getVoices();
  }, []);

  const parar = useCallback(() => {
    if (!suportado) return;
    sessao.current++;
    fila.current = [];
    window.speechSynthesis.cancel();
    setFalando(false);
  }, []);

  const falar = useCallback(
    (texto: string) => {
      if (!suportado) return;
      window.speechSynthesis.cancel();
      const minhaSessao = ++sessao.current;
      const frases = quebrarEmFrases(texto);
      if (frases.length === 0) return;
      setFalando(true);
      // O idioma é lido agora: a pessoa pode ter trocado a bandeira.
      const alvo = vozAtual();
      void esperarVozes().then(vozes => {
        if (sessao.current !== minhaSessao) return; // tocou em parar enquanto esperava
        const voz = escolherVoz(vozes, alvo);
        if (!voz) {
          // Sem voz do idioma, o navegador leria com a voz padrão do sistema (sotaque errado).
          setFalando(false);
          setAviso(
            tx(
              'Este navegador não tem voz em português. No Windows: Configurações > Hora e idioma > Fala > Adicionar vozes > Português (Brasil). Ou abra o site no Chrome ou no Edge.',
              'This browser has no English voice. On Windows: Settings > Time & language > Speech > Add voices > English (United States). Or open the site in Chrome or Edge, which include English voices.'
            )
          );
          return;
        }
        setAviso(null);
        fila.current = frases.map((frase, i) => {
          const fala = new SpeechSynthesisUtterance(frase);
          fala.lang = voz?.lang ?? alvo;
          if (voz) fala.voice = voz;
          fala.rate = 0.95;
          const ultima = i === frases.length - 1;
          const terminar = () => {
            if (sessao.current === minhaSessao && ultima) setFalando(false);
          };
          fala.onend = terminar;
          fala.onerror = e => {
            // 'interrupted'/'canceled' vêm do próprio parar(); qualquer outro erro encerra a fila.
            if (sessao.current !== minhaSessao) return;
            if (e.error !== 'interrupted' && e.error !== 'canceled') parar();
            else terminar();
          };
          return fala;
        });
        // Enfileirar todas de uma vez: o navegador fala em ordem e cada frase é curta.
        fila.current.forEach(f => window.speechSynthesis.speak(f));
      });
    },
    [parar]
  );

  // Para de falar ao sair da página
  useEffect(() => parar, [parar]);

  return { suportado, falando, falar, parar, aviso, fecharAviso: () => setAviso(null) };
}
