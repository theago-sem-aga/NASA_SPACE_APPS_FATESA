// Textos da tela de acompanhamento. O front só traduz o que a API mandou.
import type { EstadoArea } from '../../api/tipos';
import { NOME_MES } from '../fluxo/rotulos';

export const FRASE_ESTADO: Record<EstadoArea, string> = {
  terra_descoberta: 'Terra sem planta',
  pouca_planta: 'Pouca planta',
  planta_verde: 'Planta verde'
};
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${NOME_MES[mes - 1]} de ${ano}`;
}

