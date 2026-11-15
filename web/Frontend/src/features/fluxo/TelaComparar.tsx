import { LegendaMedidor } from '../../components/LegendaMedidor';
import { NomeCientifico } from '../../components/NomeCientifico';
import { useState } from 'react';
import type { Analise, AtributosEstrategia, Estrategia, Nivel } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { BotaoFigura } from '../../components/BotaoFigura';
import { Icone } from '../../components/Icone';
import { Medidor } from '../../components/Medidor';
import { Pictograma, PICTOGRAMA_CULTURA } from '../../components/Pictograma';
import { PICTO_ATRIBUTO, ROTULO_ATRIBUTO, ROTULO_CONFIANCA } from './rotulos';

interface TelaCompararProps {
  analise: Analise;
  aoAbrir: (estrategiaId: string) => void;
  aoVoltar: () => void;
  /** A pessoa decidiu: segue para a animação e o acompanhamento. */
  aoEscolher: (estrategiaId: string) => void;
}

/** Linhas sempre visíveis; as outras aparecem em "Ver mais pontos". */
const PRINCIPAIS: (keyof AtributosEstrategia)[] = ['protecao_solo', 'materia_organica', 'renda_direta', 'trabalho_custo'];
const EXTRAS = (Object.keys(ROTULO_ATRIBUTO) as (keyof AtributosEstrategia)[]).filter(a => !PRINCIPAIS.includes(a));

/** Nome curto para o topo da coluna: a etapa do meio da rotação (ex.: "Amendoim"). */
const nomeCurto = (e: Estrategia) => e.etapas_rotacao[1]?.nome ?? e.nome;

const VALOR: Record<Nivel, number> = { nenhum: 0, baixo: 1, medio: 2, alto: 3 };
type Criterio = keyof AtributosEstrategia | 'descoberto';
const mesesDescobertos = (e: Estrategia) => e.calendario.filter(m => m.cobertura === 'solo_descoberto').length;

/** Nota de 0 a 3 (ou meses) em que "maior = melhor para você", para ordenar as colunas. */
function notaPara(e: Estrategia, c: Criterio): number {
  if (c === 'descoberto') return -mesesDescobertos(e);
  const v = VALOR[e.atributos[c]];
  return ROTULO_ATRIBUTO[c].maiorEhMelhor ? v : -v;
}
const nomeCriterio = (c: Criterio) => (c === 'descoberto' ? 'Menos meses de terra descoberta' : ROTULO_ATRIBUTO[c].nome);

export function TelaComparar({ analise, aoAbrir, aoVoltar, aoEscolher }: TelaCompararProps) {
  const [verTudo, setVerTudo] = useState(false);
  const [criterio, setCriterio] = useState<Criterio | null>(null);
  // Ordena as colunas pelo ponto escolhido (estável: empate mantém a ordem sugerida).
  const estrategias = criterio
    ? analise.estrategias.map((e, k) => ({ e, k })).sort((x, y) => notaPara(y.e, criterio) - notaPara(x.e, criterio) || x.k - y.k).map(x => x.e)
    : analise.estrategias;
  const melhorNota = criterio ? notaPara(estrategias[0], criterio) : null;
  const ehMelhor = (e: Estrategia) => criterio !== null && notaPara(e, criterio) === melhorNota;
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  // De cara, só os pontos principais; os outros aparecem em "+ mais pontos" (ou se um deles estiver escolhido).
  const opcoesCriterio: Criterio[] =
    maisOpcoes || (criterio !== null && criterio !== 'descoberto' && EXTRAS.includes(criterio))
      ? [...PRINCIPAIS, 'descoberto', ...EXTRAS]
      : [...PRINCIPAIS, 'descoberto'];
  const linhas = verTudo || (criterio !== null && criterio !== 'descoberto' && EXTRAS.includes(criterio)) ? [...PRINCIPAIS, ...EXTRAS] : PRINCIPAIS;

  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>Lado a lado</h1>
      <LegendaMedidor menosEhMelhor />

      <div className="ordenar-por" role="group" aria-labelledby="ordenar-por-titulo">
        <p id="ordenar-por-titulo" className="ordenar-por-titulo">O que mais importa para você? Toque e os caminhos se reorganizam:</p>
        <div className="ordenar-por-opcoes">
          <button type="button" className={`ordenar-chip${criterio === null ? ' ativo' : ''}`} aria-pressed={criterio === null} onClick={() => setCriterio(null)}>
            Ordem sugerida
          </button>
          {opcoesCriterio.map(c => (
            <button key={c} type="button" className={`ordenar-chip${criterio === c ? ' ativo' : ''}`} aria-pressed={criterio === c} onClick={() => setCriterio(c)}>
              <Pictograma nome={c === 'descoberto' ? 'terra_descoberta' : PICTO_ATRIBUTO[c]} tamanho={20} />
              {nomeCriterio(c)}
            </button>
          ))}
          {!maisOpcoes && (
            <button type="button" className="ordenar-chip ordenar-chip-mais" onClick={() => setMaisOpcoes(true)}>
              + mais pontos
            </button>
          )}
        </div>
        <p className="ordenar-por-estado" aria-live="polite">
          {criterio
            ? `Melhor em "${nomeCriterio(criterio).toLowerCase()}": ${estrategias.filter(ehMelhor).map(nomeCurto).join(' e ')}.`
            : 'Na ordem sugerida pelas suas escolhas; o jeito de hoje fica por último, para comparar.'}
        </p>
      </div>

      <div className="rolagem-horizontal cartao tabela-comparacao-moldura">
        <table className="tabela tabela-comparacao">
          <caption className="visualmente-oculto">Comparação entre os caminhos. Toque no nome para ver o caminho.</caption>
          <thead>
            <tr>
              <th scope="col"><span className="visualmente-oculto">Ponto</span></th>
              {estrategias.map(e => {
                const meio = e.etapas_rotacao[1];
                return (
                  <th key={e.estrategia_id} scope="col" className={ehMelhor(e) ? 'comparacao-melhor' : undefined}>
                    {ehMelhor(e) && <span className="selo-melhor">★ Melhor nisso</span>}
                    <button type="button" className="comparacao-cabeca" onClick={() => aoAbrir(e.estrategia_id)}>
                      {meio && <Pictograma nome={PICTOGRAMA_CULTURA[meio.cultura_id] ?? 'nao_sei'} tamanho={40} />}
                      <span className="comparacao-nome">{nomeCurto(e)}</span>
                      <NomeCientifico culturaId={meio?.cultura_id} />
                      <span className="visualmente-oculto">: {e.nome}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {linhas.map(a => (
              <tr key={a} className={criterio === a ? 'comparacao-linha-ativa' : undefined}>
                <th scope="row">
                  <span className="comparacao-criterio">
                    <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={28} />
                    {ROTULO_ATRIBUTO[a].nome}
                  </span>
                </th>
                {estrategias.map(e => (
                  <td key={e.estrategia_id} className={ehMelhor(e) ? 'comparacao-melhor' : undefined}>
                    <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className={criterio === 'descoberto' ? 'comparacao-linha-ativa' : undefined}>
              <th scope="row">
                <span className="comparacao-criterio">
                  <Pictograma nome="terra_descoberta" tamanho={28} />
                  Meses de terra descoberta
                </span>
              </th>
              {estrategias.map(e => (
                <td key={e.estrategia_id} className={`comparacao-numero${ehMelhor(e) ? ' comparacao-melhor' : ''}`}>{mesesDescobertos(e)}</td>
              ))}
            </tr>
            {verTudo && (
              <tr>
                <th scope="row">
                  <span className="comparacao-criterio">
                    <Pictograma nome="certeza" tamanho={28} />
                    Quanta certeza
                  </span>
                </th>
                {estrategias.map(e => <td key={e.estrategia_id}>{ROTULO_CONFIANCA[e.confianca]}</td>)}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* No celular, a tabela vira uma lista: um ponto por bloco, os caminhos um embaixo do outro. */}
      <div className="comparacao-lista">
        {[...linhas, 'descoberto' as const].map(a => (
          <section key={a} className={`comparacao-item${criterio === a ? ' ativo' : ''}`}>
            <h3 className="comparacao-item-titulo">
              <Pictograma nome={a === 'descoberto' ? 'terra_descoberta' : PICTO_ATRIBUTO[a]} tamanho={28} />
              {a === 'descoberto' ? 'Meses de terra descoberta' : ROTULO_ATRIBUTO[a].nome}
            </h3>
            <ul>
              {estrategias.map(e => (
                <li key={e.estrategia_id} className={ehMelhor(e) ? 'comparacao-melhor' : undefined}>
                  <span className="comparacao-item-nome">
                    {ehMelhor(e) && <span aria-hidden="true">★ </span>}
                    {nomeCurto(e)}
                  </span>
                  {a === 'descoberto' ? (
                    <strong>{mesesDescobertos(e)} {mesesDescobertos(e) === 1 ? 'mês' : 'meses'}</strong>
                  ) : (
                    <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <button type="button" className="link-discreto" aria-expanded={verTudo} onClick={() => setVerTudo(v => !v)}>
        {verTudo ? 'Mostrar menos' : `Ver mais ${EXTRAS.length + 1} pontos`}
      </button>

      <fieldset className="grade-escolhas decisao-opcoes">
        <legend className="titulo-secao">Qual caminho você escolhe?</legend>
        {estrategias.map(e => {
          const meio = e.etapas_rotacao[1];
          return (
            <BotaoFigura
              key={e.estrategia_id}
              pictograma={meio ? PICTOGRAMA_CULTURA[meio.cultura_id] ?? 'nao_sei' : 'nao_sei'}
              titulo={nomeCurto(e)}
              detalhe={e.eh_pratica_atual ? 'O jeito de hoje' : undefined}
              escolhido={false}
              aoTocar={() => aoEscolher(e.estrategia_id)}
            />
          );
        })}
      </fieldset>

      <div className="navegacao navegacao-unica">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
      </div>
    </>
  );
}
