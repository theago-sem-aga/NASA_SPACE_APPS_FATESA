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

/** Os quatro pontos mostrados de cara. Os outros ficam em "Todos os pontos". */
const PRINCIPAIS: (keyof AtributosEstrategia)[] = ['protecao_solo', 'materia_organica', 'renda_direta', 'trabalho_custo'];
const TODOS = Object.keys(ROTULO_ATRIBUTO) as (keyof AtributosEstrategia)[];
const NIVEIS_CONFIANCA = ['baixa', 'media', 'alta'] as const;

const SITUACAO_RECURSO: Record<Resposta, { simbolo: string; texto: string; classe: string }> = {
  sim: { simbolo: '✓', texto: 'você tem', classe: 'requisito-ok' },
  nao: { simbolo: '✕', texto: 'você não tem', classe: 'requisito-falta' },
  nao_sei: { simbolo: '?', texto: 'você não sabe', classe: 'requisito-duvida' }
};

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
      {e.eh_pratica_atual && <p className="sobretitulo">O jeito de hoje, para comparar</p>}
      <h1 tabIndex={-1}>{e.nome}</h1>
      <NomeCientificoCaminho estrategia={e} />
      <FaixaRotacao etapas={e.etapas_rotacao} />
      <p className="texto-grande"><strong>Para quê:</strong> {e.objetivo}</p>

      <AnoDaTerra estrategia={e} clima={clima} fonteClima={fonteClima} />

      <ul className="quatro-pontos" aria-label="Num olhar">
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
        <ul className="lista-requisitos" aria-label="O que precisa ter">
          {e.requisitos.map(r => {
            const s = SITUACAO_RECURSO[recursos[r] ?? 'nao_sei'];
            return (
              <li key={r} className={s.classe}>
                <Pictograma nome={PICTO_REQUISITO[r]} tamanho={32} />
                <span>Precisa de <strong>{ROTULO_REQUISITO[r].nome.toLowerCase()}</strong>: {s.texto}</span>
                <span className="requisito-simbolo" aria-hidden="true">{s.simbolo}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="bom-e-cuidado">
        <section className="bloco-info bloco-beneficio">
          <h2 className="bloco-info-titulo"><Icone nome="ok" /> O que você ganha</h2>
          <Lista itens={e.beneficios} />
        </section>
        <section className="bloco-info bloco-risco">
          <h2 className="bloco-info-titulo"><Icone nome="alerta" /> Cuidado com</h2>
          <Lista itens={e.riscos} />
        </section>
      </div>

      <p className="pergunta-agronomo">
        <Icone nome="pessoa" tamanho={24} />
        <span><strong>Pergunte ao agrônomo:</strong> {e.pergunta_especialista}</span>
      </p>

      <p className={`confianca-linha confianca-${e.confianca}`}>
        <span className="confianca-medidor" aria-hidden="true">
          {NIVEIS_CONFIANCA.map((n, i) => <span key={n} className={i <= nivelConfianca ? 'cheio' : ''} />)}
        </span>
        {e.confianca === 'baixa' ? (
          <strong>Baixo volume de dados para referência, averiguar com consultor agrônomo</strong>
        ) : (
          <>
            <strong>{ROTULO_CONFIANCA[e.confianca]}</strong>
            <Termo id="confianca">O que isso quer dizer</Termo>
          </>
        )}
      </p>

      <div className="sanfonas">
        <Sanfona icone="lampada" titulo="Como funciona">
          <p>{e.resumo}</p>
          <Lista itens={e.motivos} />
          {imagem && <Foto imagem={imagem} classe="foto-faixa" />}
        </Sanfona>
        <Sanfona icone="calendario" titulo="Mês a mês">
          <CalendarioCobertura calendario={e.calendario} culturaId={e.etapas_rotacao[0]?.cultura_id} />
        </Sanfona>
        <Sanfona icone="alvo" titulo="Todos os pontos" contagem={TODOS.length}>
          <LegendaMedidor menosEhMelhor />
          <ul className="quatro-pontos todos-pontos">
            {TODOS.map(a => (
              <li key={a}>
                <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={36} />
                <span className="quatro-pontos-texto">
                  <span className="quatro-pontos-rotulo">
                    {ROTULO_ATRIBUTO[a].nome}
                    {!ROTULO_ATRIBUTO[a].maiorEhMelhor && <span className="etiqueta-menos">menos é melhor</span>}
                  </span>
                  <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  <span className="ponto-descricao">{DESCRICAO_ATRIBUTO[a]}</span>
                </span>
              </li>
            ))}
          </ul>
        </Sanfona>
        <Sanfona icone="dados" titulo="Por que dizemos isso" contagem={e.evidencias.length}>
          <Lista itens={e.evidencias} />
          <p className="texto-apoio">{e.explicacao_confianca}</p>
        </Sanfona>
        <Sanfona icone="info" titulo="O que ainda não sabemos" contagem={e.lacunas.length}>
          <Lista itens={e.lacunas} />
        </Sanfona>
        {e.referencias.length > 0 && (
          <Sanfona icone="tubo" titulo="Onde conferir" contagem={e.referencias.length}>
            <Lista itens={e.referencias} />
          </Sanfona>
        )}
      </div>

      <Navegacao aoVoltar={aoVoltar} aoAvancar={aoAvancar} rotuloAvancar="Ver a chuva" />
    </>
  );
}
