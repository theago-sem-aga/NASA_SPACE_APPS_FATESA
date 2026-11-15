// Pega a posição do aparelho e já traduz para o município.
// O pedido só sai quando a pessoa toca no botão: o aviso do navegador aparece
// logo depois de um gesto dela, e não do nada na hora que a página abre.
import { useCallback, useRef, useState } from 'react';
import { buscarLocalPorCoordenada, FalhaApi, simulacaoPedida } from '../../api/cliente';
import type { Local } from '../../api/tipos';
import { tx } from '../../i18n/idioma';

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
      aoFalhar(tx('Este aparelho não informa onde está. Escreva o nome da cidade.', 'This device does not report its location. Type the town name.'));
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
              ? tx('Esse ponto fica fora da área que a gente cobre. Escreva a cidade da plantação.', 'That point is outside the area we cover. Type the town where the field is.')
              : tx('Achamos o ponto, mas não o nome da cidade. Escreva a cidade.', 'We found the point, but not the town name. Type the town.')
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
            ? tx('Tudo bem, sem a localização também funciona. Só escrever a cidade.', 'That’s fine, it works without location too. Just type the town.')
            : tx('O celular não conseguiu achar onde você está. Escreva a cidade.', 'Your phone could not find where you are. Type the town.')
        );
      },
      { enableHighAccuracy: false, timeout: LIMITE_MS, maximumAge: 10 * 60 * 1000 }
    );
  }, [aoAchar, aoFalhar]);

  return { situacao, mostrarDica, pedir };
}
