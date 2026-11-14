import { Icone } from './Icone';

export function EstadoCarregando({ mensagem }: { mensagem: string }) {
  return (
    <div className="estado" role="status">
      <span className="carregador" aria-hidden="true" />
      <p>{mensagem}</p>
    </div>
  );
}

interface EstadoFalhaProps {
  titulo: string;
  mensagem: string;
  acaoRotulo: string;
  aoAgir: () => void;
}

export function EstadoFalha({ titulo, mensagem, acaoRotulo, aoAgir }: EstadoFalhaProps) {
  return (
    <div className="estado estado-falha" role="alert">
      <Icone nome="alerta" tamanho={32} />
      <div>
        <p className="estado-titulo">{titulo}</p>
        <p>{mensagem}</p>
      </div>
      <button type="button" className="botao botao-secundario" onClick={aoAgir}>
        {acaoRotulo}
      </button>
    </div>
  );
}
