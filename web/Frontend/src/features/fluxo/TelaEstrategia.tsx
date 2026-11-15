import { LegendaMedidor } from '../../components/LegendaMedidor';
import { NomeCientificoCaminho } from '../../components/NomeCientifico';
import type { AtributosEstrategia, ClimaMensal, Estrategia, RequisitoId, Resposta } from '../../api/tipos';
import { AnoDaTerra } from '../../components/AnoDaTerra';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { CalendarioCobertura } from '../../components/CalendarioCobertura';
import { FaixaRotacao } from '../../components/FaixaRotacao';
import { Foto } from '../../components/Foto';
import { Icone } from '../../components/Icone';
import { IMAGEM_ESTRATEGIA } from '../../components/imagens';
import { Medidor } from '../../components/Medidor';
import { Navegacao } from '../../components/Navegacao';
import { Pictograma } from '../../components/Pictograma';
import { Sanfona } from '../../components/Sanfona';
import { Termo } from '../../components/Termo';
import { DESCRICAO_ATRIBUTO, PICTO_ATRIBUTO, PICTO_REQUISITO, ROTULO_ATRIBUTO, ROTULO_CONFIANCA, ROTULO_REQUISITO } from './rotulos';
import { L, traduzivel, tx } from '../../i18n/idioma';

/** Os quatro pontos mostrados de cara. Os outros ficam em "Todos os pontos". */
const PRINCIPAIS: (keyof AtributosEstrategia)[] = ['protecao_solo', 'materia_organica', 'renda_direta', 'trabalho_custo'];
const TODOS = Object.keys(ROTULO_ATRIBUTO) as (keyof AtributosEstrategia)[];
const NIVEIS_CONFIANCA = ['baixa', 'media', 'alta'] as const;

const SITUACAO_RECURSO: Record<Resposta, { simbolo: string; texto: string; classe: string }> = traduzivel({
  sim: { simbolo: '✓', texto: L('você tem', 'you have it'), classe: 'requisito-ok' },
  nao: { simbolo: '✕', texto: L('você não tem', 'you do not have it'), classe: 'requisito-falta' },
  nao_sei: { simbolo: '?', texto: L('você não sabe', 'you are not sure'), classe: 'requisito-duvida' }
});

interface TelaEstrategiaProps {
  estrategia: Estrategia;
  ehMock: boolean;
  recursos: Record<RequisitoId, Resposta | null>;
  /** Chuva média de cada mês, para "O ano da sua terra". */
  clima: ClimaMensal[];
  fonteClima?: string;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

function Lista({ itens }: { itens: string[] }) {
  return itens.length === 1 ? <p>{itens[0]}</p> : <ul>{itens.map(t => <li key={t}>{t}</li>)}</ul>;
}

/**
 * Detalhe de um caminho. De cara: faixa da rotação, para que serve, 4 pontos,
 * o bom, o cuidado e a pergunta ao agrônomo. O resto fica em sanfonas fechadas.
 */
export function TelaEstrategia({ estrategia: e, ehMock, recursos, clima, fonteClima, aoVoltar, aoAvancar }: TelaEstrategiaProps) {
  const imagem = IMAGEM_ESTRATEGIA[e.estrategia_id];
  const nivelConfianca = NIVEIS_CONFIANCA.indexOf(e.confianca);
  return (
    <>
      <AvisoDemonstracao ehMock={ehMock} />
      {e.eh_pratica_atual && <p className="sobretitulo">{tx('O jeito de hoje, para comparar', 'Today’s practice, for comparison')}</p>}
      <h1 tabIndex={-1}>{e.nome}</h1>
      <NomeCientificoCaminho estrategia={e} />
      <FaixaRotacao etapas={e.etapas_rotacao} />
      <p className="texto-grande"><strong>{tx('Para quê:', 'Goal:')}</strong> {e.objetivo}</p>

      <AnoDaTerra estrategia={e} clima={clima} fonteClima={fonteClima} />

      <ul className="quatro-pontos" aria-label={tx('Num olhar', 'At a glance')}>
        {PRINCIPAIS.map(a => (
          <li key={a}>
            <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={36} />
            <span className="quatro-pontos-texto">
              <span className="quatro-pontos-rotulo">{ROTULO_ATRIBUTO[a].nome}</span>
              <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
            </span>
          </li>
        ))}
      </ul>

      {e.requisitos.length > 0 && (
        <ul className="lista-requisitos" aria-label={tx('O que precisa ter', 'What you need')}>
          {e.requisitos.map(r => {
            const s = SITUACAO_RECURSO[recursos[r] ?? 'nao_sei'];
            return (
              <li key={r} className={s.classe}>
                <Pictograma nome={PICTO_REQUISITO[r]} tamanho={32} />
                <span>
                  {tx('Precisa de', 'Needs')} <strong>{ROTULO_REQUISITO[r].nome.toLowerCase()}</strong>: {s.texto}
                </span>
                <span className="requisito-simbolo" aria-hidden="true">{s.simbolo}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="bom-e-cuidado">
        <section className="bloco-info bloco-beneficio">
          <h2 className="bloco-info-titulo"><Icone nome="ok" /> {tx('O que você ganha', 'What you gain')}</h2>
          <Lista itens={e.beneficios} />
        </section>
        <section className="bloco-info bloco-risco">
          <h2 className="bloco-info-titulo"><Icone nome="alerta" /> {tx('Cuidado com', 'Watch out for')}</h2>
          <Lista itens={e.riscos} />
        </section>
      </div>

      <p className="pergunta-agronomo">
        <Icone nome="pessoa" tamanho={24} />
        <span><strong>{tx('Pergunte ao agrônomo:', 'Ask the agronomist:')}</strong> {e.pergunta_especialista}</span>
      </p>

      <p className={`confianca-linha confianca-${e.confianca}`}>
        <span className="confianca-medidor" aria-hidden="true">
          {NIVEIS_CONFIANCA.map((n, i) => <span key={n} className={i <= nivelConfianca ? 'cheio' : ''} />)}
        </span>
        {e.confianca === 'baixa' ? (
          <strong>{tx('Baixo volume de dados para referência, averiguar com consultor agrônomo', 'Little reference data; check with an agronomist')}</strong>
        ) : (
          <>
            <strong>{ROTULO_CONFIANCA[e.confianca]}</strong>
            <Termo id="confianca">{tx('O que isso quer dizer', 'What this means')}</Termo>
          </>
        )}
      </p>

      <div className="sanfonas">
        <Sanfona icone="lampada" titulo={tx('Como funciona', 'How it works')}>
          <p>{e.resumo}</p>
          <Lista itens={e.motivos} />
          {imagem && <Foto imagem={imagem} classe="foto-faixa" />}
        </Sanfona>
        <Sanfona icone="calendario" titulo={tx('Mês a mês', 'Month by month')}>
          <CalendarioCobertura calendario={e.calendario} culturaId={e.etapas_rotacao[0]?.cultura_id} />
        </Sanfona>
        <Sanfona icone="alvo" titulo={tx('Todos os pontos', 'All criteria')} contagem={TODOS.length}>
          <LegendaMedidor menosEhMelhor />
          <ul className="quatro-pontos todos-pontos">
            {TODOS.map(a => (
              <li key={a}>
                <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={36} />
                <span className="quatro-pontos-texto">
                  <span className="quatro-pontos-rotulo">
                    {ROTULO_ATRIBUTO[a].nome}
                    {!ROTULO_ATRIBUTO[a].maiorEhMelhor && <span className="etiqueta-menos">{tx('menos é melhor', 'less is better')}</span>}
                  </span>
                  <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  <span className="ponto-descricao">{DESCRICAO_ATRIBUTO[a]}</span>
                </span>
              </li>
            ))}
          </ul>
        </Sanfona>
        <Sanfona icone="dados" titulo={tx('Por que dizemos isso', 'Why we say this')} contagem={e.evidencias.length}>
          <Lista itens={e.evidencias} />
          <p className="texto-apoio">{e.explicacao_confianca}</p>
        </Sanfona>
        <Sanfona icone="info" titulo={tx('O que ainda não sabemos', 'What we do not know yet')} contagem={e.lacunas.length}>
          <Lista itens={e.lacunas} />
        </Sanfona>
        {e.referencias.length > 0 && (
          <Sanfona icone="tubo" titulo={tx('Onde conferir', 'Where to check')} contagem={e.referencias.length}>
            <Lista itens={e.referencias} />
          </Sanfona>
        )}
      </div>

      <Navegacao aoVoltar={aoVoltar} aoAvancar={aoAvancar} rotuloAvancar={tx('Ver a chuva', 'See the rain')} />
    </>
  );
}
