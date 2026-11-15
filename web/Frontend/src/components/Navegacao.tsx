import { Icone } from './Icone';
import { tx } from '../i18n/idioma';

interface NavegacaoProps {
  aoVoltar: () => void;
  aoAvancar: () => void;
  rotuloAvancar?: string;
  avancarDesabilitado?: boolean;
  idAjuda?: string;
}

export function Navegacao({ aoVoltar, aoAvancar, rotuloAvancar, avancarDesabilitado, idAjuda }: NavegacaoProps) {
  return (
    <div className="navegacao">
      <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
        <Icone nome="voltar" /> {tx('Voltar', 'Back')}
      </button>
      <button
        type="button"
        className="botao botao-primario"
        onClick={aoAvancar}
        aria-disabled={avancarDesabilitado || undefined}
        aria-describedby={avancarDesabilitado ? idAjuda : undefined}
      >
        {rotuloAvancar ?? tx('Continuar', 'Continue')} <Icone nome="seguir" />
      </button>
    </div>
  );
}
