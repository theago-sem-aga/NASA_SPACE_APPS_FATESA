import { NomeCientifico } from '../../components/NomeCientifico';
import { useCallback, useEffect, useState } from 'react';
import { buscarPainelProducao, FalhaApi } from '../../api/cliente';
import type { ChuvaDoMes, ColheitaCultura, Local, PainelProducao, PrevisaoClima, SituacaoColheita, Tendencia } from '../../api/tipos';
import { EstadoCarregando, EstadoFalha } from '../../components/Estados';
import { Icone } from '../../components/Icone';
import { Pictograma, PICTOGRAMA_CULTURA, type NomePictograma } from '../../components/Pictograma';
import { FRASE_CHUVA, FRASE_CHUVA_MES, FRASE_COLHEITA, FRASE_PREVISAO_CALOR, FRASE_PREVISAO_CHUVA, fraseCalor, fraseChuvaAno } from './frases';
import { roteiroProducao } from './roteiroProducao';
import { tx, useIdioma } from '../../i18n/idioma';

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
        {sua && <span className="etiqueta etiqueta-positiva">{tx('Sua lavoura', 'Your crop')}</span>}
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
        <h2 id="t-previsao" className="producao-titulo">{tx('Previsão para os próximos meses', 'Forecast for the coming months')}</h2>
        <span className="etiqueta etiqueta-atencao">{tx('Previsão', 'Forecast')}</span>
      </div>
      <p className="texto-apoio">
        {tx(
          `De ${pv.periodo}, para a ${pv.abrangencia.charAt(0).toLowerCase() + pv.abrangencia.slice(1)}. Previsão pode mudar.`,
          `For ${pv.periodo}, covering ${pv.abrangencia}. Forecasts can change.`
        )}
      </p>

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

      <ol className="producao-meses" aria-label={tx('Chuva mês a mês', 'Rain month by month')}>
        {pv.meses.map(m => (
          <li key={m.mes} className={`producao-mes producao-mes-${m.chuva}`}>
            <strong>{m.nome}</strong>
            <Pictograma nome={FIGURA_MES[m.chuva]} tamanho={56} />
            <span>{FRASE_CHUVA_MES[m.chuva]}</span>
          </li>
        ))}
      </ol>

      <h3 className="producao-subtitulo">{tx('O que fazer', 'What to do')}</h3>
      <ul className="producao-dicas">
        {pv.dicas.map(d => (
          <li key={d.frase}>
            {/* figura vem da API; nome desconhecido cai no pictograma "não sei" */}
            <Pictograma nome={d.figura as NomePictograma} tamanho={52} />
            <span>{d.frase}</span>
          </li>
        ))}
      </ul>
      <p className="texto-apoio producao-fonte">{tx('Fonte:', 'Source:')} {pv.fonte}.</p>
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
  // Os nomes e textos do painel vêm da API no idioma da tela: troca a bandeira, recarrega.
  const idioma = useIdioma();

  const carregar = useCallback(async () => {
    setEstado({ situacao: 'carregando' });
    try {
      setEstado({ situacao: 'sucesso', painel: await buscarPainelProducao(local) });
    } catch (e) {
      const f = e instanceof FalhaApi ? e : new FalhaApi('erro_inesperado', tx('Algo deu errado.', 'Something went wrong.'));
      setEstado({ situacao: 'falha', codigo: f.codigo, mensagem: f.message });
    }
  }, [local, idioma]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const painel = estado.situacao === 'sucesso' ? estado.painel : null;
  useEffect(() => {
    aoMudarRoteiro(painel ? roteiroProducao(painel, ehExemplo, culturaAtualId) : tx('Buscando os números da colheita.', 'Fetching the harvest numbers.'));
  }, [painel, ehExemplo, culturaAtualId, aoMudarRoteiro]);

  if (estado.situacao === 'carregando') {
    return (
      <>
        <h1 tabIndex={-1}>{tx('Como foi a colheita', 'How the harvest went')}</h1>
        <EstadoCarregando mensagem={tx('Buscando os números da cidade…', 'Fetching the numbers for the town…')} />
      </>
    );
  }
  if (estado.situacao === 'falha') {
    const semDados = estado.codigo === 'dados_insuficientes';
    return (
      <>
        <h1 tabIndex={-1}>{tx('Como foi a colheita', 'How the harvest went')}</h1>
        <EstadoFalha
          titulo={semDados ? tx('Sem números dessa cidade', 'No numbers for this town') : tx('Deu um problema', 'Something went wrong')}
          mensagem={estado.mensagem}
          acaoRotulo={semDados ? tx('Continuar', 'Continue') : tx('Tentar de novo', 'Try again')}
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
        <h1 tabIndex={-1}>{tx('Como foi a colheita', 'How the harvest went')}</h1>
        <p className="texto-apoio">
          {ehExemplo ? tx('Exemplo: ', 'Example: ') : ''}
          {nomeLocal} · {p.municipio ? tx('números da cidade toda', 'numbers for the whole town') : tx('números da região toda', 'numbers for the whole region')}
        </p>
      </div>

      <div className="producao-grade">
        <section className="producao-bloco" aria-labelledby="t-colheita">
          <h2 id="t-colheita" className="producao-titulo">{tx(`A colheita de ${ano}`, `The ${ano} harvest`)}</h2>
          {sua && (
            <ul className="producao-culturas">
              <LinhaCultura c={sua} sua />
            </ul>
          )}
          {outras.length > 0 && (
            <div className="producao-outras">
              <span className="texto-apoio">
                {p.municipio
                  ? sua ? tx('Outras lavouras da cidade', 'Other crops in the town') : tx('Lavouras da cidade', 'Crops in the town')
                  : sua ? tx('Outras lavouras do condado', 'Other crops in the county') : tx('Lavouras do condado', 'Crops in the county')}
              </span>
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
          <h2 id="t-tempo" className="producao-titulo">{p.clima ? tx(`O tempo em ${p.clima.ano}`, `The weather in ${p.clima.ano}`) : tx('O tempo', 'The weather')}</h2>
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
            <p className="texto-apoio">{tx('Ainda não há dado de clima para esta região.', 'No climate data for this region yet.')}</p>
          )}
        </section>
      </div>

      <details className="detalhes cartao">
        <summary>{tx('De onde vêm esses números', 'Where these numbers come from')}</summary>
        <ul>
          {p.fontes.map(f => <li key={f}>{f}</li>)}
          {p.limitacoes.map(l => <li key={l}>{l}</li>)}
          <li>{tx('Calculado em', 'Calculated on')} {tx(p.gerado_em.split('-').reverse().join('/'), p.gerado_em)}.</li>
        </ul>
      </details>

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> {tx('Voltar', 'Back')}
        </button>
        <button type="button" className="botao botao-primario" onClick={aoContinuar}>
          {tx('Continuar', 'Continue')} <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
