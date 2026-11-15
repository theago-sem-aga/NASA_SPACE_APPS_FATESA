import { SINALIZAR_MOCK, USANDO_MOCK } from '../api/cliente';
import { Icone } from './Icone';

/** Faixa de "dados de exemplo". Só aparece com VITE_SINALIZAR_MOCK=true (ver api/cliente.ts). */
export function AvisoDemonstracao({ ehMock }: { ehMock: boolean }) {
  if (!ehMock || !SINALIZAR_MOCK) return null;
  return (
    <p className="aviso-demonstracao">
      <Icone nome="info" tamanho={20} />
      <span>
        {USANDO_MOCK ? (
          <>
            <strong>Demonstração:</strong> os dados desta tela são de exemplo.
          </>
        ) : (
          <>
            <strong>Simulação:</strong> os caminhos desta tela são uma hipótese de teste, ainda sem conferência de um agrônomo. Clima e solo são dados reais. Converse com um agrônomo antes de decidir.
          </>
        )}
      </span>
    </p>
  );
}
