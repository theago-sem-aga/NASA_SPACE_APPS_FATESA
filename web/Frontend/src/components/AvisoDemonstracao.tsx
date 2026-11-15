import { SINALIZAR_MOCK } from '../api/cliente';
import { Icone } from './Icone';

/** Faixa de "dados de exemplo". Só aparece com VITE_SINALIZAR_MOCK=true (ver api/cliente.ts). */
export function AvisoDemonstracao({ ehMock }: { ehMock: boolean }) {
  if (!ehMock || !SINALIZAR_MOCK) return null;
  return (
    <p className="aviso-demonstracao">
      <Icone nome="info" tamanho={20} />
      <span>
        <strong>Simulação:</strong> os números e textos desta tela são uma hipótese de teste, ainda sem conferência de um agrônomo. Converse com um agrônomo antes de decidir.
      </span>
    </p>
  );
}
