import { useState } from 'react';
import type { Analise, AtributosEstrategia, Estrategia } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { Icone } from '../../components/Icone';
import { Medidor } from '../../components/Medidor';
import { Pictograma, PICTOGRAMA_CULTURA } from '../../components/Pictograma';
import { PICTO_ATRIBUTO, ROTULO_ATRIBUTO, ROTULO_CONFIANCA } from './rotulos';

interface TelaCompararProps {
  analise: Analise;
  aoAbrir: (estrategiaId: string) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

/** Linhas sempre visíveis; as outras aparecem em "Ver mais pontos". */
const PRINCIPAIS: (keyof AtributosEstrategia)[] = ['protecao_solo', 'materia_organica', 'renda_direta', 'trabalho_custo'];
const EXTRAS = (Object.keys(ROTULO_ATRIBUTO) as (keyof AtributosEstrategia)[]).filter(a => !PRINCIPAIS.includes(a));

/** Nome curto para o topo da coluna: a etapa do meio da rotação (ex.: "Amendoim"). */
const nomeCurto = (e: Estrategia) => e.etapas_rotacao[1]?.nome ?? e.nome;

export function TelaComparar({ analise, aoAbrir, aoVoltar, aoAvancar }: TelaCompararProps) {
  const [verTudo, setVerTudo] = useState(false);
  const estrategias = analise.estrategias;
  const linhas = verTudo ? [...PRINCIPAIS, ...EXTRAS] : PRINCIPAIS;

  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>Lado a lado</h1>
      <p className="legenda-medidor">
        <span><span className="amostra-medidor amostra-bom" aria-hidden="true" /> Verde: bom</span>
        <span><span className="amostra-medidor amostra-atencao" aria-hidden="true" /> Laranja: pesa contra</span>
      </p>

      <div className="rolagem-horizontal cartao tabela-comparacao-moldura">
        <table className="tabela tabela-comparacao">
          <caption className="visualmente-oculto">Comparação entre os caminhos. Toque no nome para ver o caminho.</caption>
          <thead>
            <tr>
              <th scope="col"><span className="visualmente-oculto">Ponto</span></th>
              {estrategias.map(e => {
                const meio = e.etapas_rotacao[1];
                return (
                  <th key={e.estrategia_id} scope="col">
                    <button type="button" className="comparacao-cabeca" onClick={() => aoAbrir(e.estrategia_id)}>
                      {meio && <Pictograma nome={PICTOGRAMA_CULTURA[meio.cultura_id] ?? 'nao_sei'} tamanho={40} />}
                      <span className="comparacao-nome">{nomeCurto(e)}</span>
                      <span className="visualmente-oculto">: {e.nome}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {linhas.map(a => (
              <tr key={a}>
                <th scope="row">
                  <span className="comparacao-criterio">
                    <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={28} />
                    {ROTULO_ATRIBUTO[a].nome}
                  </span>
                </th>
                {estrategias.map(e => (
                  <td key={e.estrategia_id}>
                    <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span className="comparacao-criterio">
                  <Pictograma nome="terra_descoberta" tamanho={28} />
                  Meses de terra descoberta
                </span>
              </th>
              {estrategias.map(e => (
                <td key={e.estrategia_id} className="comparacao-numero">{e.calendario.filter(m => m.cobertura === 'solo_descoberto').length}</td>
              ))}
            </tr>
            {verTudo && (
              <tr>
                <th scope="row">
                  <span className="comparacao-criterio">
                    <Pictograma nome="nao_sei" tamanho={28} />
                    Quanta certeza
                  </span>
                </th>
                {estrategias.map(e => <td key={e.estrategia_id}>{ROTULO_CONFIANCA[e.confianca]}</td>)}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="link-discreto" aria-expanded={verTudo} onClick={() => setVerTudo(v => !v)}>
        {verTudo ? 'Mostrar menos' : `Ver mais ${EXTRAS.length + 1} pontos`}
      </button>

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        <button type="button" className="botao botao-primario" onClick={aoAvancar}>
          Ver meu resumo <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
