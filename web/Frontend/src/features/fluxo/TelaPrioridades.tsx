import { useState } from 'react';
import { vocabulario } from './vocabularioCultura';
import type { PrioridadeId } from '../../api/tipos';
import { CartaoEscolha } from '../../components/CartaoEscolha';
import { Icone } from '../../components/Icone';
import { Navegacao } from '../../components/Navegacao';
import { MAX_PRIORIDADES, type DadosFluxo } from './estadoFluxo';
import { explicacaoPrioridade, ORDEM_PRIORIDADES, PICTO_PRIORIDADE, ROTULO_PRIORIDADE } from './rotulos';
import { tx } from '../../i18n/idioma';

interface TelaPrioridadesProps {
  dados: DadosFluxo;
  aoMudar: (parcial: Partial<DadosFluxo>) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

export function TelaPrioridades({ dados, aoMudar, aoVoltar, aoAvancar }: TelaPrioridadesProps) {
  const [erro, setErro] = useState<string | null>(null);
  const cheio = dados.prioridades.length >= MAX_PRIORIDADES;

  function alternar(id: PrioridadeId) {
    const marcada = dados.prioridades.includes(id);
    if (!marcada && cheio) return;
    aoMudar({ prioridades: marcada ? dados.prioridades.filter(p => p !== id) : [...dados.prioridades, id] });
    setErro(null);
  }

  function avancar() {
    if (dados.prioridades.length === 0) {
      setErro(tx('Toque em pelo menos uma figura.', 'Tap at least one picture.'));
      return;
    }
    aoAvancar();
  }

  return (
    <>
      <h1 tabIndex={-1}>
        {vocabulario(dados.cultura_atual_id, dados.nomeCultura).nestePeriodo}, {tx('o que é mais importante para você?', 'what matters most to you?')}
      </h1>
      <fieldset className="grade-escolhas">
        <legend className="texto-apoio">
          {tx('Escolha até', 'Choose up to')} {MAX_PRIORIDADES}.{' '}
          <span className="contador" aria-live="polite">
            {Array.from({ length: MAX_PRIORIDADES }, (_, i) => (
              <span key={i} className={i < dados.prioridades.length ? 'contador-cheio' : ''} aria-hidden="true" />
            ))}
            <span className="visualmente-oculto">
              {dados.prioridades.length} {tx('de', 'of')} {MAX_PRIORIDADES} {tx('escolhidas', 'chosen')}
            </span>
          </span>
        </legend>
        {ORDEM_PRIORIDADES.map(id => (
          <CartaoEscolha
            key={id}
            tipo="checkbox"
            marcado={dados.prioridades.includes(id)}
            desabilitado={!dados.prioridades.includes(id) && cheio}
            pictograma={PICTO_PRIORIDADE[id]}
            titulo={ROTULO_PRIORIDADE[id].nome}
            detalhe={explicacaoPrioridade(id, dados.nomeCultura)}
            aoMudar={() => alternar(id)}
          />
        ))}
      </fieldset>
      {cheio && <p className="texto-apoio">{tx('Para trocar, toque de novo numa das escolhidas.', 'To change, tap one of your choices again.')}</p>}
      {erro && (
        <p className="mensagem-erro" role="alert">
          <Icone nome="alerta" tamanho={20} /> {erro}
        </p>
      )}
      <Navegacao aoVoltar={aoVoltar} aoAvancar={avancar} rotuloAvancar={tx('Ver os caminhos', 'See the options')} />
    </>
  );
}
