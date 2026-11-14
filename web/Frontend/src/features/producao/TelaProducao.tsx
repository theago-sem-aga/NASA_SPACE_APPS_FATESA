import { useCallback, useEffect, useState } from 'react';
import { buscarPainelProducao, CODIGO_IBGE_EXEMPLO, FalhaApi } from '../../api/cliente';
import type { CenarioId, ColheitaCultura, Local, PainelProducao, SituacaoColheita } from '../../api/tipos';
import { EstadoCarregando, EstadoFalha } from '../../components/Estados';
import { Icone } from '../../components/Icone';
import { Pictograma, PICTOGRAMA_CULTURA, type NomePictograma } from '../../components/Pictograma';
import { FRASE_CHUVA, FRASE_COLHEITA, fraseCalor, fraseCenario } from './frases';
import { roteiroProducao } from './roteiroProducao';

interface TelaProducaoProps {
  /** Local escolhido no fluxo. null = abre com a cidade de exemplo. */
  local: Local | null;
  /** Cultura que a pessoa disse ter plantado: aparece primeiro, marcada. */
  culturaAtualId: string | null;
  /** Texto do botão "Ouvir" desta tela (o cabeçalho é quem fala). */
  aoMudarRoteiro: (texto: string) => void;
  aoVoltar: () => void;
  /** Segue para a próxima pergunta do fluxo. */
  aoContinuar: () => void;
}

type Situacao =
  | { situacao: 'carregando' }
  | { situacao: 'sucesso'; painel: PainelProducao }
  | { situacao: 'falha'; codigo: string; mensagem: string };

const FIGURA_CENARIO: Record<CenarioId, NomePictograma> = { seco: 'seca', normal: 'agua', chuvoso: 'chuva' };

// ---------- peças visuais ----------

type Rumo = 'sobe' | 'igual' | 'desce' | 'duvida' | 'nada';

function rumoDaColheita(s: SituacaoColheita): Rumo {
  return s === 'acima' ? 'sobe' : s === 'abaixo' ? 'desce' : s === 'normal' ? 'igual' : 'nada';
}
function rumoDoCenario(sacos: number | null): Rumo {
  return sacos === null ? 'duvida' : sacos > 0 ? 'sobe' : sacos < 0 ? 'desce' : 'igual';
}

/** Seta grande (sobe/desce), sinal de igual ou interrogação. Sempre acompanha uma frase. */
function Seta({ rumo, tamanho = 56 }: { rumo: Rumo; tamanho?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={tamanho} height={tamanho} viewBox="0 0 48 48" className={`seta seta-${rumo}`}>
      <circle cx="24" cy="24" r="22" className="seta-fundo" />
      {rumo === 'sobe' && <path d="M24 10l13 14h-8v13h-10V24h-8z" className="seta-tinta" />}
      {rumo === 'desce' && <path d="M24 38L11 24h8V11h10v13h8z" className="seta-tinta" />}
      {rumo === 'igual' && <path d="M13 17h22v5H13zM13 26h22v5H13z" className="seta-tinta" />}
      {rumo === 'duvida' && (
        <>
          <path d="M18 18c0-8 12-8 12 0 0 5-6 5-6 11" fill="none" strokeWidth="4.5" strokeLinecap="round" className="seta-traco" />
          <circle cx="24" cy="36" r="3" className="seta-tinta" />
        </>
      )}
      {rumo === 'nada' && <path d="M14 22h20v5H14z" className="seta-tinta" />}
    </svg>
  );
}

function Gotas({ quantas, total = 10, tom }: { quantas: number; total?: number; tom: 'normal' | 'alerta' }) {
  return (
    <span className="gotas" aria-hidden="true">
      {Array.from({ length: Math.max(total, quantas) }, (_, i) => (
        <svg key={i} width="22" height="22" viewBox="0 0 24 24" className={i < quantas ? `gota-cheia gota-${tom}` : 'gota-vazia'}>
          <path d="M12 2C8 8 5 12 5 15.5a7 7 0 0 0 14 0C19 12 16 8 12 2z" />
        </svg>
      ))}
    </span>
  );
}

/** 20 sacos = 100 sacos (cada figura vale 5). Perda apaga sacos; ganho acrescenta sacos verdes. */
function Sacos({ sacos }: { sacos: number }) {
  const mudam = Math.max(1, Math.round(Math.abs(sacos) / 5));
  const total = sacos > 0 ? 20 + mudam : 20;
  return (
    <span className="sacos" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const classe = sacos < 0 && i >= 20 - mudam ? 'saco-perdido' : sacos > 0 && i >= 20 ? 'saco-ganho' : '';
        return (
          <span key={i} className={`saco ${classe}`}>
            <Pictograma nome="saco" tamanho={26} semFundo />
          </span>
        );
      })}
    </span>
  );
}

function LinhaCultura({ c, sua }: { c: ColheitaCultura; sua: boolean }) {
  const frase = FRASE_COLHEITA[c.situacao];
  return (
    <li className={`producao-cultura producao-${c.situacao}`}>
      <Pictograma nome={PICTOGRAMA_CULTURA[c.cultura_id] ?? 'nao_sei'} tamanho={64} />
      <span className="producao-cultura-texto">
        <strong className="producao-nome">{c.nome}</strong>
        <span>{frase}</span>
        {sua && <span className="etiqueta etiqueta-positiva">Sua lavoura</span>}
      </span>
      <Seta rumo={rumoDaColheita(c.situacao)} />
    </li>
  );
}

// ---------- tela ----------

export function TelaProducao({ local, culturaAtualId, aoMudarRoteiro, aoVoltar, aoContinuar }: TelaProducaoProps) {
  const codigo = local?.codigo_ibge || CODIGO_IBGE_EXEMPLO;
  const ehExemplo = !local?.codigo_ibge;
  const [estado, setEstado] = useState<Situacao>({ situacao: 'carregando' });
  const [cenario, setCenario] = useState<CenarioId>('seco');

  const carregar = useCallback(async () => {
    setEstado({ situacao: 'carregando' });
    try {
      setEstado({ situacao: 'sucesso', painel: await buscarPainelProducao(codigo) });
    } catch (e) {
      const f = e instanceof FalhaApi ? e : new FalhaApi('erro_inesperado', 'Algo deu errado.');
      setEstado({ situacao: 'falha', codigo: f.codigo, mensagem: f.message });
    }
  }, [codigo]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const painel = estado.situacao === 'sucesso' ? estado.painel : null;
  useEffect(() => {
    aoMudarRoteiro(painel ? roteiroProducao(painel, cenario, ehExemplo) : 'Buscando os números da colheita.');
  }, [painel, cenario, ehExemplo, aoMudarRoteiro]);

  if (estado.situacao === 'carregando') {
    return (
      <>
        <h1 tabIndex={-1}>Como foi a colheita</h1>
        <EstadoCarregando mensagem="Buscando os números da cidade…" />
      </>
    );
  }
  if (estado.situacao === 'falha') {
    const semDados = estado.codigo === 'dados_insuficientes';
    return (
      <>
        <h1 tabIndex={-1}>Como foi a colheita</h1>
        <EstadoFalha
          titulo={semDados ? 'Sem números dessa cidade' : 'Deu um problema'}
          mensagem={estado.mensagem}
          acaoRotulo={semDados ? 'Continuar' : 'Tentar de novo'}
          aoAgir={semDados ? aoContinuar : () => void carregar()}
        />
      </>
    );
  }

  const p = estado.painel;
  const ano = p.culturas[0]?.ano ?? p.clima.ano;
  const calor = fraseCalor(p.clima);
  const escolhido = p.cenarios.find(c => c.cenario_id === cenario) ?? p.cenarios[0];
  const pouca = p.clima.situacao_chuva === 'pouca';
  // A cultura da pessoa vem primeiro (o resto mantém a ordem da API).
  const culturas = [...p.culturas].sort((a, b) => Number(b.cultura_id === culturaAtualId) - Number(a.cultura_id === culturaAtualId));

  return (
    <>
      <div className="producao-topo">
        <h1 tabIndex={-1}>Como foi a colheita</h1>
        <p className="texto-apoio">
          {ehExemplo ? 'Exemplo: ' : ''}
          {p.municipio} ({p.uf}) · números da cidade toda
        </p>
      </div>

      <div className="producao-grade">
        <section className="producao-bloco" aria-labelledby="t-colheita">
          <h2 id="t-colheita" className="producao-titulo">A colheita de {ano}</h2>
          <ul className="producao-culturas">
            {culturas.map(c => <LinhaCultura key={c.cultura_id} c={c} sua={c.cultura_id === culturaAtualId} />)}
          </ul>
        </section>

        <section className="producao-bloco" aria-labelledby="t-tempo">
          <h2 id="t-tempo" className="producao-titulo">O tempo em {p.clima.ano}</h2>
          <div className={`producao-cartao ${pouca ? 'producao-cartao-alerta' : ''}`}>
            <div className="producao-cartao-cab">
              <Pictograma nome="chuva" tamanho={64} />
              <span>
                <strong className="producao-nome">{FRASE_CHUVA[p.clima.situacao_chuva]}</strong>
                <span className="texto-apoio">De cada 10 chuvas, caíram {p.clima.gotas_em_10}</span>
              </span>
            </div>
            <div className="producao-gotas">
              <span className="producao-gotas-rotulo">Normal</span>
              <Gotas quantas={10} tom="normal" />
              <span className="producao-gotas-rotulo">{p.clima.ano}</span>
              <Gotas quantas={p.clima.gotas_em_10} tom={pouca ? 'alerta' : 'normal'} />
            </div>
          </div>
          <div className={`producao-cartao ${p.clima.situacao_calor === 'mais_quente' ? 'producao-cartao-alerta' : ''}`}>
            <div className="producao-cartao-cab">
              <Pictograma nome="calor" tamanho={64} />
              <span>
                <strong className="producao-nome">{calor.titulo}</strong>
                <span className="texto-apoio">{calor.detalhe}</span>
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="producao-bloco" aria-labelledby="t-ese">
        <h2 id="t-ese" className="producao-titulo">E se o próximo ano for…</h2>
        <div className="producao-cenarios" role="group" aria-label="Tipo de ano">
          {p.cenarios.map(c => (
            <button
              key={c.cenario_id}
              type="button"
              className="producao-cenario"
              aria-pressed={c.cenario_id === cenario}
              onClick={() => setCenario(c.cenario_id)}
            >
              <Pictograma nome={FIGURA_CENARIO[c.cenario_id]} tamanho={56} />
              <span>{c.nome.replace('Ano ', '')}</span>
            </button>
          ))}
        </div>
        <ul className="producao-resultados" aria-live="polite">
          {escolhido.culturas.map(r => {
            const cultura = p.culturas.find(c => c.cultura_id === r.cultura_id);
            const frase = fraseCenario(r.sacos_em_100);
            return (
              <li key={r.cultura_id} className="producao-cartao producao-resultado">
                <div className="producao-cartao-cab">
                  <Pictograma nome={PICTOGRAMA_CULTURA[r.cultura_id] ?? 'nao_sei'} tamanho={56} />
                  <span className="producao-cultura-texto">
                    <strong className="producao-nome">{cultura?.nome ?? r.cultura_id}</strong>
                    <span>{frase}</span>
                  </span>
                  <Seta rumo={rumoDoCenario(r.sacos_em_100)} tamanho={48} />
                </div>
                {r.sacos_em_100 !== null && r.sacos_em_100 !== 0 && <Sacos sacos={r.sacos_em_100} />}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="destaque destaque-neutro">
        <Icone nome="pessoa" tamanho={24} />
        É uma ajuda. Converse com o técnico antes de decidir.
      </p>

      <details className="detalhes cartao">
        <summary>De onde vêm esses números</summary>
        <ul>
          {p.fontes.map(f => <li key={f}>{f}</li>)}
          {p.limitacoes.map(l => <li key={l}>{l}</li>)}
          <li>Calculado em {p.gerado_em.split('-').reverse().join('/')}.</li>
        </ul>
      </details>

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        <button type="button" className="botao botao-primario" onClick={aoContinuar}>
          Continuar <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
