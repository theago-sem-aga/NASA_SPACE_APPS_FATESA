import { Icone } from './Icone';

interface NavegacaoProps {
  aoVoltar: () => void;
  aoAvancar: () => void;
  rotuloAvancar?: string;
  avancarDesabilitado?: boolean;
  idAjuda?: string;
}

export function Navegacao({ aoVoltar, aoAvancar, rotuloAvancar = 'Continuar', avancarDesabilitado, idAjuda }: NavegacaoProps) {
  return (
    <div className="navegacao">
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
        <Icone nome="voltar" /> Voltar
      </button>
      <button
        type="button"
        className="botao botao-primario"
        onClick={aoAvancar}
        aria-disabled={avancarDesabilitado || undefined}
        aria-describedby={avancarDesabilitado ? idAjuda : undefined}
      >
        {rotuloAvancar} <Icone nome="seguir" />
      </button>
    </div>
  );
}
