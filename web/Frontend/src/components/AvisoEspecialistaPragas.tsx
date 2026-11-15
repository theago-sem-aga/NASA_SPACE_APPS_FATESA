import { Icone } from './Icone';

/**
 * Aviso quando a pessoa marca praga ou nematoide: o site não define o controle
 * específico; o que aparece é sugestão, e o controle certo pede um especialista.
 */
export function AvisoEspecialistaPragas() {
  return (
    <p className="destaque destaque-atencao" role="note">
      <Icone nome="alerta" />
      <span>
        <strong>Isto é uma sugestão.</strong> Para um controle específico de pragas e nematoides, com a escolha certa de plantas para
        cada caso, é preciso contatar um especialista, como um engenheiro agrônomo. Ele pode pedir uma análise de solo e de raiz para
        saber qual praga existe na sua área.
      </span>
    </p>
  );
}
