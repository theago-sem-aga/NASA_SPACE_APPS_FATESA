import { NomeCientifico } from '../../components/NomeCientifico';
import { useEffect, useState } from 'react';
import { listarCulturas, FalhaApi } from '../../api/cliente';
import type { Cultura } from '../../api/tipos';
import { BotaoFigura } from '../../components/BotaoFigura';
import { EstadoCarregando, EstadoFalha } from '../../components/Estados';
import { Icone } from '../../components/Icone';
import { PICTOGRAMA_CULTURA } from '../../components/Pictograma';
import type { DadosFluxo } from './estadoFluxo';
import { tx, useIdioma } from '../../i18n/idioma';

interface TelaCulturaProps {
  dados: DadosFluxo;
  aoEscolher: (cultura: Cultura) => void;
  aoVoltar: () => void;
}

export function TelaCultura({ dados, aoEscolher, aoVoltar }: TelaCulturaProps) {
  const [culturas, setCulturas] = useState<Cultura[] | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  // Os nomes das culturas vêm da API no idioma da tela: troca a bandeira, recarrega.
  const idioma = useIdioma();

  useEffect(() => {
    let ativo = true;
    setFalha(null);
    listarCulturas()
      .then(lista => ativo && setCulturas(lista))
      .catch((e: unknown) => ativo && setFalha(e instanceof FalhaApi ? e.message : tx('Não deu para carregar a lista.', 'Could not load the list.')));
    return () => {
      ativo = false;
    };
  }, [tentativa, idioma]);

  function tocar(c: Cultura) {
    if (!c.tem_demonstracao) {
      const prontas = (culturas ?? []).filter(x => x.tem_demonstracao).map(x => x.nome.toLocaleLowerCase(tx('pt-BR', 'en-US')));
      setAviso(
        tx(
          `${c.nome} ainda não está pronto. Por enquanto, a ferramenta funciona para: ${prontas.join(', ')}.`,
          `${c.nome} is not ready yet. For now, the tool works for: ${prontas.join(', ')}.`
        )
      );
      return;
    }
    setAviso(null);
    aoEscolher(c);
  }

  return (
    <>
      <h1 tabIndex={-1}>{tx('O que está plantado aí hoje?', 'What is planted there today?')}</h1>
      <p className="texto-apoio">{tx('Toque na figura.', 'Tap a picture.')}</p>

      {!culturas && !falha && <EstadoCarregando mensagem={tx('Carregando…', 'Loading…')} />}
      {falha && <EstadoFalha titulo={tx('Não carregou', 'Did not load')} mensagem={falha} acaoRotulo={tx('Tentar de novo', 'Try again')} aoAgir={() => setTentativa(t => t + 1)} />}

      {culturas && (
        <div className="grade-escolhas" role="group" aria-label={tx('O que está plantado', 'What is planted')}>
          {culturas.map(c => (
            <BotaoFigura
              key={c.cultura_id}
              pictograma={PICTOGRAMA_CULTURA[c.cultura_id] ?? 'nao_sei'}
              titulo={c.nome}
              detalhe={<NomeCientifico culturaId={c.cultura_id} />}
              selo={c.tem_demonstracao ? undefined : tx('Em breve', 'Coming soon')}
              escolhido={dados.cultura_atual_id === c.cultura_id}
              aoTocar={() => tocar(c)}
            />
          ))}
        </div>
      )}

      <div aria-live="polite">
        {aviso && (
          <p className="caixa-porque">
            <Icone nome="info" tamanho={20} /> <span>{aviso}</span>
          </p>
        )}
      </div>

      <div className="navegacao navegacao-unica">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> {tx('Voltar', 'Back')}
        </button>
      </div>
    </>
  );
}
