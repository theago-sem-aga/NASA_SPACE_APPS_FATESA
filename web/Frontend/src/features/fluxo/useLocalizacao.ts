// Pega a posição do aparelho e já traduz para o município.
// O pedido só sai quando a pessoa toca no botão: o aviso do navegador aparece
// logo depois de um gesto dela, e não do nada na hora que a página abre.
import { useCallback, useRef, useState } from 'react';
import { buscarLocalPorCoordenada, FalhaApi, simulacaoPedida } from '../../api/cliente';
import type { Local } from '../../api/tipos';

export type SituacaoGps = 'parado' | 'pedindo' | 'achando_cidade';

interface Resultado {
  aoAchar: (local: Local) => void;
  /** Mensagem curta e sem tom de erro, mostrada em cima da busca por cidade. */
  aoFalhar: (motivo: string) => void;
}

const LIMITE_MS = 12000;

async function permissaoJaDada(): Promise<boolean | null> {
  try {
    const estado = await navigator.permissions?.query({ name: 'geolocation' });
    return estado ? estado.state === 'granted' : null;
  } catch {
    return null;
  }
}

export function useLocalizacao({ aoAchar, aoFalhar }: Resultado) {
  const [situacao, setSituacao] = useState<SituacaoGps>('parado');
  /** true enquanto o navegador está mostrando a pergunta "Permitir localização?". */
  const [mostrarDica, setMostrarDica] = useState(false);
  const pedidoAtual = useRef(0);

  const pedir = useCallback(async () => {
    const pedido = ++pedidoAtual.current;
    const vigente = () => pedido === pedidoAtual.current;

    if (!navigator.geolocation || simulacaoPedida() === 'sem_gps') {
      aoFalhar('Este aparelho não informa onde está. Escreva o nome da cidade.');
      return;
    }
    setSituacao('pedindo');
    setMostrarDica((await permissaoJaDada()) !== true);

    navigator.geolocation.getCurrentPosition(
      async pos => {
        if (!vigente()) return;
        setMostrarDica(false);
        setSituacao('achando_cidade');
        try {
          aoAchar(await buscarLocalPorCoordenada(pos.coords.latitude, pos.coords.longitude));
        } catch (e) {
          aoFalhar(
            e instanceof FalhaApi && e.codigo === 'fora_da_cobertura'
              ? 'Esse ponto fica fora da área que cobrimos. Escreva a cidade da plantação.'
              : 'Achamos o ponto, mas não o nome da cidade. Escreva a cidade.'
          );
        } finally {
          if (vigente()) setSituacao('parado');
        }
      },
      erro => {
        if (!vigente()) return;
        setMostrarDica(false);
        setSituacao('parado');
        aoFalhar(
          erro.code === erro.PERMISSION_DENIED
            ? 'Tudo bem, sem a localização também funciona. Só escrever a cidade.'
            : 'O celular não conseguiu achar onde você está. Escreva a cidade.'
        );
      },
      { enableHighAccuracy: false, timeout: LIMITE_MS, maximumAge: 10 * 60 * 1000 }
    );
  }, [aoAchar, aoFalhar]);

  return { situacao, mostrarDica, pedir };
}
