import type { Estrategia, RequisitoId, Resposta } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { CalendarioCobertura } from '../../components/CalendarioCobertura';
import { Foto } from '../../components/Foto';
import { Icone, type NomeIcone } from '../../components/Icone';
import { IMAGEM_ESTRATEGIA } from '../../components/imagens';
import { Navegacao } from '../../components/Navegacao';
import { Termo } from '../../components/Termo';
import type { AtributosEstrategia } from '../../api/tipos';
import { FaixaRotacao } from '../../components/FaixaRotacao';
import { Medidor } from '../../components/Medidor';
import { Pictograma } from '../../components/Pictograma';
import { PICTO_ATRIBUTO, PICTO_REQUISITO, ROTULO_ATRIBUTO, ROTULO_CONFIANCA, ROTULO_REQUISITO } from './rotulos';

const ATRIBUTOS = Object.keys(ROTULO_ATRIBUTO) as (keyof AtributosEstrategia)[];

interface TelaEstrategiaProps {
  estrategia: Estrategia;
  ehMock: boolean;
  recursos: Record<RequisitoId, Resposta>;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

function Bloco({ icone, titulo, classe, itens }: { icone: NomeIcone; titulo: string; classe: string; itens: string[] }) {
  return (
    <section className={`bloco-info ${classe}`}>
      <h2 className="bloco-info-titulo"><Icone nome={icone} /> {titulo}</h2>
      {itens.length === 1 ? (
        <p>{itens[0]}</p>
      ) : (
        <ul>
          {itens.map(t => <li key={t}>{t}</li>)}
        </ul>
      )}
    </section>
  );
}

const TEXTO_RECURSO: Record<Resposta, { texto: string; classe: string }> = {
  sim: { texto: 'você disse que tem', classe: 'requisito-ok' },
  nao: { texto: 'você disse que não tem', classe: 'requisito-falta' },
  nao_sei: { texto: 'você não informou', classe: 'requisito-duvida' }
};

export function TelaEstrategia({ estrategia: e, ehMock, recursos, aoVoltar, aoAvancar }: TelaEstrategiaProps) {
  const imagem = IMAGEM_ESTRATEGIA[e.estrategia_id];
  return (
    <>
      <AvisoDemonstracao ehMock={ehMock} />
      {e.eh_pratica_atual && <p className="sobretitulo">O que você faz hoje</p>}
      <h1 tabIndex={-1}>{e.nome}</h1>
      <p className="texto-grande">{e.resumo}</p>
      {imagem && <Foto imagem={imagem} classe="foto-faixa" />}

      <section className="cartao" aria-labelledby="titulo-num-olhar">
        <h2 id="titulo-num-olhar" className="titulo-secao">Num olhar</h2>
        <FaixaRotacao etapas={e.etapas_rotacao} />
        <ul className="painel-atributos">
          {ATRIBUTOS.map(a => (
            <li key={a} className="painel-atributo">
              <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={44} />
              <span className="painel-atributo-rotulo">{ROTULO_ATRIBUTO[a].nome}</span>
              <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} grande />
            </li>
          ))}
        </ul>
      </section>

      <div className={`confianca confianca-${e.confianca}`}>
        <span className="confianca-medidor" aria-hidden="true">
          {(['baixa', 'media', 'alta'] as const).map(n => (
            <span key={n} className={['baixa', 'media', 'alta'].indexOf(n) <= ['baixa', 'media', 'alta'].indexOf(e.confianca) ? 'cheio' : ''} />
          ))}
        </span>
        <span>
          <strong>{ROTULO_CONFIANCA[e.confianca]}.</strong> {e.explicacao_confianca} <Termo id="confianca">Entenda</Termo>
        </span>
      </div>

      <Bloco icone="pergunta" titulo="Por que apareceu aqui" classe="bloco-motivo" itens={e.motivos} />
      <Bloco icone="alvo" titulo="Para que serve" classe="bloco-objetivo" itens={[e.objetivo]} />
      <CalendarioCobertura calendario={e.calendario} />

      {e.requisitos.length > 0 && (
        <section className="bloco-info bloco-requisito">
          <h2 className="bloco-info-titulo"><Icone nome="info" /> O que precisa ter</h2>
          <ul className="lista-requisitos">
            {e.requisitos.map(r => {
              const situacao = TEXTO_RECURSO[recursos[r]];
              return (
                <li key={r} className={situacao.classe}>
                  <Pictograma nome={PICTO_REQUISITO[r]} tamanho={36} />
                  <span><strong>{ROTULO_REQUISITO[r].nome}</strong>: {situacao.texto}.</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Bloco icone="dados" titulo="Em que se baseia" classe="bloco-evidencia" itens={e.evidencias} />
      <Bloco icone="ok" titulo="O que pode ganhar" classe="bloco-beneficio" itens={e.beneficios} />
      <Bloco icone="alerta" titulo="O que pode dar errado" classe="bloco-risco" itens={e.riscos} />
      <Bloco icone="info" titulo="O que a ferramenta ainda não sabe" classe="bloco-lacuna" itens={e.lacunas} />
      <Bloco icone="pessoa" titulo="Leve esta pergunta ao agrônomo" classe="bloco-pergunta" itens={[e.pergunta_especialista]} />

      {e.referencias.length > 0 && (
        <details className="detalhes cartao">
          <summary>Onde conferir (referências)</summary>
          <ul>
            {e.referencias.map(r => <li key={r}>{r}</li>)}
          </ul>
        </details>
      )}

      <Navegacao aoVoltar={aoVoltar} aoAvancar={aoAvancar} rotuloAvancar="Ver a chuva do local" />
    </>
  );
}
