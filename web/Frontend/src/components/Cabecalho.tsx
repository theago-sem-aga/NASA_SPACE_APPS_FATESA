import { Icone } from './Icone';

interface CabecalhoProps {
  passoAtual: number;
  totalPassos: number;
  tituloPasso: string;
  narracao: { suportado: boolean; falando: boolean; aoOuvir: () => void; aoParar: () => void };
}

export function Cabecalho({ passoAtual, totalPassos, tituloPasso, narracao }: CabecalhoProps) {
  return (
    <header className="cabecalho">
      <div className="conteudo cabecalho-topo">
        <div className="marca">
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="#1F4D2C" />
            <path d="M7 20c3-1.5 6-1.5 9 0s6 1.5 9 0M7 14c3-1.5 6-1.5 9 0s6 1.5 9 0" stroke="#E9D9A6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>
            {/* Nome do produto ainda não definido pela equipe (convenção §10) */}
            <span className="marca-nome">Rotação de culturas</span>
            <span className="marca-sub">Planejamento da reforma</span>
          </span>
        </div>
        {narracao.suportado && (
          <button
            type="button"
            className="botao-ouvir"
            onClick={narracao.falando ? narracao.aoParar : narracao.aoOuvir}
            aria-pressed={narracao.falando}
          >
            <Icone nome={narracao.falando ? 'parar' : 'ouvir'} tamanho={20} />
            {narracao.falando ? 'Parar' : 'Ouvir esta tela'}
          </button>
        )}
      </div>
      {passoAtual > 0 && (
        <div className="conteudo progresso">
          <div className="progresso-trilho" aria-hidden="true">
            <span className="progresso-preenchido" style={{ width: `${(passoAtual / totalPassos) * 100}%` }} />
          </div>
          <p className="progresso-texto">
            Passo {passoAtual} de {totalPassos} · {tituloPasso}
          </p>
        </div>
      )}
    </header>
  );
}
