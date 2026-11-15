// Textos da tela de acompanhamento. O front só traduz o que a API mandou.
import type { EstadoArea } from '../../api/tipos';
import { NOME_MES } from '../fluxo/rotulos';
import { L, traduzivel, tx } from '../../i18n/idioma';

export const FRASE_ESTADO: Record<EstadoArea, string> = traduzivel({
  terra_descoberta: L('Terra sem planta', 'Bare ground'),
  pouca_planta: L('Pouca planta', 'Few plants'),
  planta_verde: L('Planta verde', 'Green plants')
});
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return tx(`${dia} de ${NOME_MES[mes - 1]} de ${ano}`, `${NOME_MES[mes - 1]} ${dia}, ${ano}`);
}

