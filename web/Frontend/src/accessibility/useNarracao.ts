// Narração opcional ("Ouvir esta tela"). Usa a síntese de voz do aparelho
// quando existe; não captura microfone e não depende de serviço externo.
import { useCallback, useEffect, useState } from 'react';

const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useNarracao() {
  const [falando, setFalando] = useState(false);

  const parar = useCallback(() => {
    if (!suportado) return;
    window.speechSynthesis.cancel();
    setFalando(false);
  }, []);

  const falar = useCallback((texto: string) => {
    if (!suportado) return;
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = 0.95;
    fala.onend = () => setFalando(false);
    fala.onerror = () => setFalando(false);
    setFalando(true);
    window.speechSynthesis.speak(fala);
  }, []);

  // Para de falar ao sair da página
  useEffect(() => parar, [parar]);

  return { suportado, falando, falar, parar };
}
