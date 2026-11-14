import { SINALIZAR_MOCK } from '../api/cliente';
import { Icone } from './Icone';

/** Faixa de "dados de exemplo". Só aparece com VITE_SINALIZAR_MOCK=true (ver api/cliente.ts). */
export function AvisoDemonstracao({ ehMock }: { ehMock: boolean }) {
  if (!ehMock || !SINALIZAR_MOCK) return null;
  return (
    <p className="aviso-demonstracao">
      <Icone nome="info" tamanho={20} />
      <span>
        <strong>Exemplo de teste:</strong> os números e textos desta tela são inventados, só para mostrar como a ferramenta vai funcionar. Não use para decidir.
      </span>
    </p>
  );
}
