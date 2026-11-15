import { NomeCientifico } from '../../components/NomeCientifico';
import { useEffect, useState } from 'react';
import { listarCulturas, FalhaApi } from '../../api/cliente';
import type { Cultura } from '../../api/tipos';
import { BotaoFigura } from '../../components/BotaoFigura';
import { EstadoCarregando, EstadoFalha } from '../../components/Estados';
import { Icone } from '../../components/Icone';
import { PICTOGRAMA_CULTURA } from '../../components/Pictograma';
import type { DadosFluxo } from './estadoFluxo';

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

  useEffect(() => {
    let ativo = true;
    setFalha(null);
    listarCulturas()
      .then(lista => ativo && setCulturas(lista))
      .catch((e: unknown) => ativo && setFalha(e instanceof FalhaApi ? e.message : 'Não deu para carregar a lista.'));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function tocar(c: Cultura) {
    if (!c.tem_demonstracao) {
      const prontas = (culturas ?? []).filter(x => x.tem_demonstracao).map(x => x.nome.toLocaleLowerCase('pt-BR'));
      setAviso(`${c.nome} ainda não está pronto. Por enquanto, a ferramenta funciona para: ${prontas.join(', ')}.`);
      return;
    }
    setAviso(null);
    aoEscolher(c);
  }

  return (
    <>
      <h1 tabIndex={-1}>O que está plantado aí hoje?</h1>
      <p className="texto-apoio">Toque na figura.</p>

      {!culturas && !falha && <EstadoCarregando mensagem="Carregando…" />}
      {falha && <EstadoFalha titulo="Não carregou" mensagem={falha} acaoRotulo="Tentar de novo" aoAgir={() => setTentativa(t => t + 1)} />}

      {culturas && (
        <div className="grade-escolhas" role="group" aria-label="O que está plantado">
          {culturas.map(c => (
            <BotaoFigura
              key={c.cultura_id}
              pictograma={PICTOGRAMA_CULTURA[c.cultura_id] ?? 'nao_sei'}
              titulo={c.nome}
              detalhe={<NomeCientifico culturaId={c.cultura_id} />}
              selo={c.tem_demonstracao ? undefined : 'Em breve'}
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
          <Icone nome="voltar" /> Voltar
        </button>
      </div>
    </>
  );
}
