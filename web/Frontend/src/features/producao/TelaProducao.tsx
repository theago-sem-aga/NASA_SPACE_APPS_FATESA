import { NomeCientifico } from '../../components/NomeCientifico';
import { useCallback, useEffect, useState } from 'react';
import { buscarPainelProducao, FalhaApi } from '../../api/cliente';
import type { ChuvaDoMes, ColheitaCultura, Local, PainelProducao, PrevisaoClima, SituacaoColheita, Tendencia } from '../../api/tipos';
import { EstadoCarregando, EstadoFalha } from '../../components/Estados';
import { Icone } from '../../components/Icone';
import { Pictograma, PICTOGRAMA_CULTURA, type NomePictograma } from '../../components/Pictograma';
import { FRASE_CHUVA, FRASE_CHUVA_MES, FRASE_COLHEITA, FRASE_PREVISAO_CALOR, FRASE_PREVISAO_CHUVA, fraseCalor, fraseChuvaAno } from './frases';
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

const FIGURA_MES: Record<ChuvaDoMes, NomePictograma> = { irregular: 'seca', melhora: 'agua', normal: 'agua', excesso: 'chuva' };

// ---------- peças visuais ----------

type Rumo = 'sobe' | 'igual' | 'desce' | 'nada';

function rumoDaColheita(s: SituacaoColheita): Rumo {
  return s === 'acima' ? 'sobe' : s === 'abaixo' ? 'desce' : s === 'normal' ? 'igual' : 'nada';
}
const RUMO_TENDENCIA: Record<Tendencia, Rumo> = { acima: 'sobe', normal: 'igual', abaixo: 'desce' };

/** Seta grande (sobe/desce) ou sinal de igual. Sempre acompanha uma frase. */
function Seta({ rumo, tamanho = 56 }: { rumo: Rumo; tamanho?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={tamanho} height={tamanho} viewBox="0 0 48 48" className={`seta seta-${rumo}`}>
      <circle cx="24" cy="24" r="22" className="seta-fundo" />
      {rumo === 'sobe' && <path d="M24 10l13 14h-8v13h-10V24h-8z" className="seta-tinta" />}
      {rumo === 'desce' && <path d="M24 38L11 24h8V11h10v13h8z" className="seta-tinta" />}
      {rumo === 'igual' && <path d="M13 17h22v5H13zM13 26h22v5H13z" className="seta-tinta" />}
      {rumo === 'nada' && <path d="M14 22h20v5H14z" className="seta-tinta" />}
    </svg>
  );
}

function LinhaCultura({ c, sua }: { c: ColheitaCultura; sua: boolean }) {
  const frase = FRASE_COLHEITA[c.situacao];
  return (
    <li className={`producao-cultura producao-${c.situacao}`}>
      <Pictograma nome={PICTOGRAMA_CULTURA[c.cultura_id] ?? 'nao_sei'} tamanho={64} />
      <span className="producao-cultura-texto">
        <strong className="producao-nome">{c.nome}</strong>
        <NomeCientifico culturaId={c.cultura_id} />
        <span>{frase}</span>
        {sua && <span className="etiqueta etiqueta-positiva">Sua lavoura</span>}
      </span>
      <Seta rumo={rumoDaColheita(c.situacao)} />
    </li>
  );
}

/** Previsão oficial dos próximos meses. Selo "Previsão" para não confundir com o que já aconteceu. */
export function SecaoPrevisao({ previsao: pv }: { previsao: PrevisaoClima }) {
  return (
    <section className="producao-bloco" aria-labelledby="t-previsao">
      <div className="producao-titulo-linha">
        <h2 id="t-previsao" className="producao-titulo">Previsão para os próximos meses</h2>
        <span className="etiqueta etiqueta-atencao">Previsão</span>
      </div>
      <p className="texto-apoio">De {pv.periodo}, para a {pv.abrangencia.charAt(0).toLowerCase() + pv.abrangencia.slice(1)}. Previsão pode mudar.</p>

      <div className="producao-previsao-resumo">
        <div className="producao-cartao">
          <div className="producao-cartao-cab">
            <Pictograma nome="chuva" tamanho={64} />
            <strong className="producao-nome">{FRASE_PREVISAO_CHUVA[pv.chuva]}</strong>
            <Seta rumo={RUMO_TENDENCIA[pv.chuva]} tamanho={48} />
          </div>
        </div>
        <div className="producao-cartao">
          <div className="producao-cartao-cab">
            <Pictograma nome="calor" tamanho={64} />
            <strong className="producao-nome">{FRASE_PREVISAO_CALOR[pv.temperatura]}</strong>
            <Seta rumo={RUMO_TENDENCIA[pv.temperatura]} tamanho={48} />
          </div>
        </div>
      </div>

      <ol className="producao-meses" aria-label="Chuva mês a mês">
        {pv.meses.map(m => (
          <li key={m.mes} className={`producao-mes producao-mes-${m.chuva}`}>
            <strong>{m.nome}</strong>
            <Pictograma nome={FIGURA_MES[m.chuva]} tamanho={56} />
            <span>{FRASE_CHUVA_MES[m.chuva]}</span>
          </li>
        ))}
      </ol>

      <h3 className="producao-subtitulo">O que fazer</h3>
      <ul className="producao-dicas">
        {pv.dicas.map(d => (
          <li key={d.frase}>
            {/* figura vem da API; nome desconhecido cai no pictograma "não sei" */}
            <Pictograma nome={d.figura as NomePictograma} tamanho={52} />
            <span>{d.frase}</span>
          </li>
        ))}
      </ul>
      <p className="texto-apoio producao-fonte">Fonte: {pv.fonte}.</p>
    </section>
  );
}

// ---------- tela ----------

export function TelaProducao({ local, culturaAtualId, aoMudarRoteiro, aoVoltar, aoContinuar }: TelaProducaoProps) {
  // "Exemplo" só quando NINGUÉM escolheu local ainda (local === null). Quando um
  // local real foi escolhido (Brasil, por código IBGE, ou qualquer coordenada
  // dos EUA, via Census Geocoder + NASS QuickStats no backend), busca de
  // verdade -- nunca mostra o número de outra cidade no lugar.
  const ehExemplo = local === null;
  const [estado, setEstado] = useState<Situacao>({ situacao: 'carregando' });

  const carregar = useCallback(async () => {
    setEstado({ situacao: 'carregando' });
    try {
      setEstado({ situacao: 'sucesso', painel: await buscarPainelProducao(local) });
    } catch (e) {
      const f = e instanceof FalhaApi ? e : new FalhaApi('erro_inesperado', 'Algo deu errado.');
      setEstado({ situacao: 'falha', codigo: f.codigo, mensagem: f.message });
    }
  }, [local]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const painel = estado.situacao === 'sucesso' ? estado.painel : null;
  useEffect(() => {
    aoMudarRoteiro(painel ? roteiroProducao(painel, ehExemplo, culturaAtualId) : 'Buscando os números da colheita.');
  }, [painel, ehExemplo, culturaAtualId, aoMudarRoteiro]);

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
        {!semDados && (
          <p>
            <button type="button" className="botao botao-secundario" onClick={aoContinuar}>
              Continuar sem o histórico de colheita
            </button>
          </p>
        )}
      </>
    );
  }

  const p = estado.painel;
  const ano = p.culturas[0]?.ano ?? p.clima?.ano ?? null;
  const calor = p.clima ? fraseCalor(p.clima) : null;
  const alerta = p.clima ? (p.clima.situacao_chuva === 'pouca' || p.clima.situacao_calor === 'mais_quente') : false;
  // A lavoura da pessoa em destaque; as outras da cidade numa linha pequena.
  const sua = p.culturas.find(c => c.cultura_id === culturaAtualId) ?? null;
  const outras = p.culturas.filter(c => c !== sua);
  const nomeLocal = p.municipio ? `${p.municipio} (${p.uf})` : p.condado ? `${p.condado} (${p.estado})` : '';

  return (
    <>
      <div className="producao-topo">
        <h1 tabIndex={-1}>Como foi a colheita</h1>
        <p className="texto-apoio">
          {ehExemplo ? 'Exemplo: ' : ''}
          {nomeLocal} · números da {p.municipio ? 'cidade' : 'região'} toda
        </p>
      </div>

      <div className="producao-grade">
        <section className="producao-bloco" aria-labelledby="t-colheita">
          <h2 id="t-colheita" className="producao-titulo">A colheita de {ano}</h2>
          {sua && (
            <ul className="producao-culturas">
              <LinhaCultura c={sua} sua />
            </ul>
          )}
          {outras.length > 0 && (
            <div className="producao-outras">
              <span className="texto-apoio">{sua ? 'Outras lavouras da cidade' : 'Lavouras da cidade'}</span>
              <ul className="producao-outras-lista">
                {outras.map(c => (
                  <li key={c.cultura_id}>
                    <Pictograma nome={PICTOGRAMA_CULTURA[c.cultura_id] ?? 'nao_sei'} tamanho={40} />
                    <span>{c.nome} <NomeCientifico culturaId={c.cultura_id} /><span className="visualmente-oculto">: {FRASE_COLHEITA[c.situacao].toLowerCase()}</span></span>
                    <Seta rumo={rumoDaColheita(c.situacao)} tamanho={28} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="producao-bloco" aria-labelledby="t-tempo">
          <h2 id="t-tempo" className="producao-titulo">{p.clima ? `O tempo em ${p.clima.ano}` : 'O tempo'}</h2>
          {p.clima && calor ? (
            <div className={`producao-cartao ${alerta ? 'producao-cartao-alerta' : ''}`}>
              <div className="producao-cartao-cab">
                <Pictograma nome="chuva" tamanho={52} />
                <span>
                  <strong className="producao-nome">{FRASE_CHUVA[p.clima.situacao_chuva]}</strong>
                  <span className="texto-apoio">{fraseChuvaAno(p.clima)}</span>
                </span>
              </div>
              <div className="producao-cartao-cab">
                <Pictograma nome="calor" tamanho={52} />
                <span>
                  <strong className="producao-nome">{calor.titulo}</strong>
                  <span className="texto-apoio">{calor.detalhe}</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="texto-apoio">Ainda não há dado de clima para esta região.</p>
          )}
        </section>
      </div>

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
