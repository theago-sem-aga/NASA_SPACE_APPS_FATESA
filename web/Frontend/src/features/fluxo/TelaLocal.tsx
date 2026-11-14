import { useState } from 'react';
import { Icone } from '../../components/Icone';
import { Navegacao } from '../../components/Navegacao';
import { formatarNumero } from './rotulos';
import type { DadosFluxo } from './estadoFluxo';

interface TelaLocalProps {
  dados: DadosFluxo;
  aoMudar: (parcial: Partial<DadosFluxo>) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

export function TelaLocal({ dados, aoMudar, aoVoltar, aoAvancar }: TelaLocalProps) {
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const temCoordenadas = dados.latitude !== null && dados.longitude !== null;

  function usarLocalizacao() {
    if (!navigator.geolocation) {
      setErro('Este aparelho não informa a localização. Escreva o município no campo abaixo.');
      return;
    }
    setBuscando(true);
    setErro(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setBuscando(false);
        aoMudar({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          descricao_local: dados.descricao_local || 'Localização atual do aparelho'
        });
      },
      () => {
        setBuscando(false);
        setErro('Não foi possível pegar a localização. Verifique a permissão do navegador ou escreva o município.');
      },
      { timeout: 15000 }
    );
  }

  function avancar() {
    if (!dados.descricao_local.trim() && !temCoordenadas) {
      setErro('Informe o município ou use a localização do aparelho para continuar.');
      document.getElementById('campo-local')?.focus();
      return;
    }
    aoAvancar();
  }

  return (
    <>
      <h1 tabIndex={-1}>Onde fica o talhão?</h1>
      <p className="texto-apoio caixa-porque">
        <Icone nome="info" tamanho={20} />
        <span>
          <strong>Para que serve:</strong> a chuva de Presidente Prudente não é a mesma de Ribeirão Preto. Com o local, buscamos o histórico de chuva e de umidade da terra daquele ponto. A localização só é usada para isso.
        </span>
      </p>

      <button type="button" className="botao botao-contorno botao-largo" onClick={usarLocalizacao} disabled={buscando}>
        <Icone nome="local" /> {buscando ? 'Buscando localização…' : 'Estou no talhão agora: usar o GPS'}
      </button>
      {temCoordenadas && (
        <p className="confirmacao" role="status">
          <Icone nome="ok" tamanho={20} /> Localização registrada: latitude {formatarNumero(dados.latitude!)}, longitude {formatarNumero(dados.longitude!)}.
        </p>
      )}

      <p className="divisor"><span>ou</span></p>

      <div className="campo">
        <label htmlFor="campo-local">Município e estado</label>
        <span id="dica-local" className="texto-apoio">Por exemplo: Olímpia – SP, ou Fazenda Santa Rita, Guaíra – SP.</span>
        <input
          id="campo-local"
          type="text"
          autoComplete="address-level2"
          value={dados.descricao_local}
          aria-describedby={`dica-local${erro ? ' erro-local' : ''}`}
          aria-invalid={erro ? true : undefined}
          onChange={e => {
            aoMudar({ descricao_local: e.target.value });
            if (erro) setErro(null);
          }}
        />
      </div>
      {erro && (
        <p id="erro-local" className="mensagem-erro" role="alert">
          <Icone nome="alerta" tamanho={20} /> {erro}
        </p>
      )}

      <Navegacao aoVoltar={aoVoltar} aoAvancar={avancar} />
    </>
  );
}
