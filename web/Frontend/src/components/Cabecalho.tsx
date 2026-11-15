import { tx } from '../i18n/idioma';
import { Icone } from './Icone';
import { SeletorIdioma } from './SeletorIdioma';

interface CabecalhoProps {
  /** Só nas telas de pergunta. null = sem bolinhas (início, local e resultados). */
  progresso: { atual: number; total: number } | null;
  tituloPasso: string;
  /** Subtítulo da marca, conforme a cultura escolhida (vocabularioCultura). */
  subtitulo: string;
  narracao: { suportado: boolean; falando: boolean; aoOuvir: () => void; aoParar: () => void; aviso?: string | null; aoFecharAviso?: () => void };
}

export function Cabecalho({ progresso, tituloPasso, subtitulo, narracao }: CabecalhoProps) {
  return (
    <header className="cabecalho">
      <div className="conteudo cabecalho-topo">
        <div className="marca">
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="#1F4D2C" />
            <path d="M7 20c3-1.5 6-1.5 9 0s6 1.5 9 0M7 14c3-1.5 6-1.5 9 0s6 1.5 9 0" stroke="#E9D9A6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>
            <span className="marca-nome">{tx('Rotação de culturas', 'Crop rotation')}</span>
            <span className="marca-sub">{subtitulo}</span>
          </span>
        </div>
        <div className="cabecalho-acoes">
          <SeletorIdioma />
          {narracao.suportado && (
            <button
              type="button"
              className="botao-ouvir"
              onClick={narracao.falando ? narracao.aoParar : narracao.aoOuvir}
              aria-pressed={narracao.falando}
            >
              <Icone nome={narracao.falando ? 'parar' : 'ouvir'} tamanho={20} />
              {narracao.falando ? tx('Parar', 'Stop') : tx('Ouvir', 'Listen')}
            </button>
          )}
        </div>
      </div>
      {narracao.aviso && (
        <div className="conteudo aviso-voz" role="status">
          <span>{narracao.aviso}</span>
          <button type="button" className="link-discreto" onClick={narracao.aoFecharAviso}>
            {tx('Fechar', 'Close')}
          </button>
        </div>
      )}
      {progresso && (
        <div className="conteudo progresso">
          <ol className="bolinhas" aria-hidden="true">
            {Array.from({ length: progresso.total }, (_, i) => (
              <li key={i} className={i < progresso.atual - 1 ? 'feita' : i === progresso.atual - 1 ? 'atual' : ''} />
            ))}
          </ol>
          <p className="progresso-texto">
            {progresso.atual} {tx('de', 'of')} {progresso.total}
            <span className="visualmente-oculto"> {tx('perguntas', 'questions')} · {tituloPasso}</span>
          </p>
        </div>
      )}
    </header>
  );
}
