// Narração opcional (botão "Ouvir"). Usa a síntese de voz do aparelho;
// não captura microfone e não depende de serviço externo.
//
// Dois cuidados que resolvem a fala que parava no meio ou soava estranha:
// 1. O Chrome corta uma fala longa depois de uns 15 segundos. Por isso o texto é
//    quebrado em frases e falado uma de cada vez, em fila.
// 2. Sem escolher a voz, alguns aparelhos leem o português com voz em inglês.
//    Por isso procuramos uma voz pt-BR (ou outra em português) antes de falar.
import { useCallback, useEffect, useRef, useState } from 'react';

const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Quebra em frases curtas, sem separar números como "5,5" nem abreviações comuns. */
export function quebrarEmFrases(texto: string): string[] {
  return texto
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"“])/)
    .map(f => f.trim())
    .filter(Boolean);
}

function escolherVoz(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  return (
    vozes.find(v => v.lang.replace('_', '-').toLowerCase() === 'pt-br' && v.localService) ??
    vozes.find(v => v.lang.replace('_', '-').toLowerCase() === 'pt-br') ??
    vozes.find(v => v.lang.toLowerCase().startsWith('pt')) ??
    null
  );
}

export function useNarracao() {
  const [falando, setFalando] = useState(false);
  const voz = useRef<SpeechSynthesisVoice | null>(null);
  // Guarda a fila: no Chrome, uma fala sem referência pode ser descartada e não avisar o fim.
  const fila = useRef<SpeechSynthesisUtterance[]>([]);
  const sessao = useRef(0);

  useEffect(() => {
    if (!suportado) return;
    const atualizar = () => {
      voz.current = escolherVoz();
    };
    atualizar();
    window.speechSynthesis.addEventListener('voiceschanged', atualizar);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', atualizar);
  }, []);

  const parar = useCallback(() => {
    if (!suportado) return;
    sessao.current++;
    fila.current = [];
    window.speechSynthesis.cancel();
    setFalando(false);
  }, []);

  const falar = useCallback((texto: string) => {
    if (!suportado) return;
    window.speechSynthesis.cancel();
    const minhaSessao = ++sessao.current;
    const frases = quebrarEmFrases(texto);
    if (frases.length === 0) return;
    voz.current ??= escolherVoz();

    fila.current = frases.map((frase, i) => {
      const fala = new SpeechSynthesisUtterance(frase);
      fala.lang = voz.current?.lang ?? 'pt-BR';
      if (voz.current) fala.voice = voz.current;
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
    setFalando(true);
    // Enfileirar todas de uma vez: o navegador fala em ordem e cada frase é curta.
    fila.current.forEach(f => window.speechSynthesis.speak(f));
  }, [parar]);

  // Para de falar ao sair da página
  useEffect(() => parar, [parar]);

  return { suportado, falando, falar, parar };
}
