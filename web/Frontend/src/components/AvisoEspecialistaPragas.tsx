import { Icone } from './Icone';
import { tx } from '../i18n/idioma';

/**
 * Aviso quando a pessoa marca praga ou nematoide: o site não define o controle
 * específico; o que aparece é sugestão, e o controle certo pede um especialista.
 */
export function AvisoEspecialistaPragas() {
  return (
    <p className="destaque destaque-atencao" role="note">
      <Icone nome="alerta" />
      <span>
        <strong>{tx('Isto é uma sugestão.', 'This is a suggestion.')}</strong>{' '}
        {tx(
          'Para um controle específico de pragas e nematoides, com a escolha certa de plantas para cada caso, é preciso contatar um especialista, como um engenheiro agrônomo. Ele pode pedir uma análise de solo e de raiz para saber qual praga existe na sua área.',
          'For specific control of pests and nematodes, with the right choice of plants for each case, you need to contact a specialist such as an agronomist. They may order a soil and root test to find out which pest is in your field.'
        )}
      </span>
    </p>
  );
}
