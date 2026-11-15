import { SINALIZAR_MOCK, USANDO_MOCK } from '../api/cliente';
import { Icone } from './Icone';
import { tx } from '../i18n/idioma';

/** Faixa de "dados de exemplo". Só aparece com VITE_SINALIZAR_MOCK=true (ver api/cliente.ts). */
export function AvisoDemonstracao({ ehMock }: { ehMock: boolean }) {
  if (!ehMock || !SINALIZAR_MOCK) return null;
  return (
    <p className="aviso-demonstracao">
      <Icone nome="info" tamanho={20} />
      <span>
        {USANDO_MOCK ? (
          <>
            <strong>{tx('Demonstração:', 'Demo:')}</strong> {tx('os dados desta tela são de exemplo.', 'the data on this screen is sample data.')}
          </>
        ) : (
          <>
            <strong>{tx('Simulação:', 'Simulation:')}</strong>{' '}
            {tx(
              'os caminhos desta tela são uma hipótese de teste, ainda sem conferência de um agrônomo. Clima e solo são dados reais. Converse com um agrônomo antes de decidir.',
              'the options on this screen are a test hypothesis, not yet checked by an agronomist. Climate and soil are real data. Talk to an agronomist before deciding.'
            )}
          </>
        )}
      </span>
    </p>
  );
}
