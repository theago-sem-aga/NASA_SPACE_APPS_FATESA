import { useEffect, useState } from 'react';
import { listarCulturas, FalhaApi } from '../../api/cliente';
import type { Cultura } from '../../api/tipos';
import { EstadoCarregando, EstadoFalha } from '../../components/Estados';
import { Icone } from '../../components/Icone';
import { Navegacao } from '../../components/Navegacao';
import { CartaoEscolha } from '../../components/CartaoEscolha';
import { PICTOGRAMA_CULTURA } from '../../components/Pictograma';
import type { DadosFluxo } from './estadoFluxo';

interface TelaCulturaProps {
  dados: DadosFluxo;
  aoMudar: (parcial: Partial<DadosFluxo>) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

export function TelaCultura({ dados, aoMudar, aoVoltar, aoAvancar }: TelaCulturaProps) {
  const [culturas, setCulturas] = useState<Cultura[] | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setFalha(null);
    listarCulturas()
      .then(lista => ativo && setCulturas(lista))
      .catch((e: unknown) => ativo && setFalha(e instanceof FalhaApi ? e.message : 'Não foi possível carregar a lista.'));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const escolhida = culturas?.find(c => c.cultura_id === dados.cultura_atual_id);

  function avancar() {
    if (!escolhida) {
      setErro('Escolha a cultura que está no talhão para continuar.');
      return;
    }
    if (!escolhida.tem_demonstracao) {
      setErro(`${escolhida.nome} chega em breve. Por enquanto, a ferramenta funciona para cana-de-açúcar.`);
      return;
    }
    aoAvancar();
  }

  return (
    <>
      <h1 tabIndex={-1}>O que está plantado nesse talhão hoje?</h1>
      <p className="texto-apoio">Toque na figura.</p>

      {!culturas && !falha && <EstadoCarregando mensagem="Carregando culturas…" />}
      {falha && <EstadoFalha titulo="Não carregou" mensagem={falha} acaoRotulo="Tentar de novo" aoAgir={() => setTentativa(t => t + 1)} />}

      {culturas && (
        <fieldset className="grade-escolhas">
          <legend className="visualmente-oculto">Cultura atual</legend>
          {culturas.map(c => (
            <CartaoEscolha
              key={c.cultura_id}
              tipo="radio"
              nomeGrupo="cultura"
              marcado={dados.cultura_atual_id === c.cultura_id}
              pictograma={PICTOGRAMA_CULTURA[c.cultura_id] ?? 'nao_sei'}
              titulo={c.nome}
              selo={c.tem_demonstracao ? undefined : 'Em breve'}
              aoMudar={() => {
                aoMudar({ cultura_atual_id: c.cultura_id, nomeCultura: c.nome });
                setErro(null);
              }}
            />
          ))}
        </fieldset>
      )}

      {erro && (
        <p className="mensagem-erro" role="alert">
          <Icone nome="alerta" tamanho={20} /> {erro}
        </p>
      )}

      <Navegacao aoVoltar={aoVoltar} aoAvancar={avancar} />
    </>
  );
}
