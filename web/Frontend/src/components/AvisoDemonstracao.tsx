import { SINALIZAR_MOCK } from '../api/cliente';
import { Icone } from './Icone';
import { tx } from '../i18n/idioma';

/** Faixa de "dados de exemplo". Só aparece com VITE_SINALIZAR_MOCK=true (ver api/cliente.ts). */
export function AvisoDemonstracao({ ehMock }: { ehMock: boolean }) {
  if (!ehMock || !SINALIZAR_MOCK) return null;
  return (
    <p className="aviso-demonstracao">
      <Icone nome="info" tamanho={20} />
      <span>
        <strong>{tx('Exemplo de teste:', 'Test example:')}</strong>{' '}
        {tx(
          'os números e textos desta tela são inventados, só para mostrar como a ferramenta vai funcionar. Não use para decidir.',
          'the numbers and texts on this screen are made up, only to show how the tool will work. Do not use them to decide.'
        )}
      </span>
    </p>
  );
}
