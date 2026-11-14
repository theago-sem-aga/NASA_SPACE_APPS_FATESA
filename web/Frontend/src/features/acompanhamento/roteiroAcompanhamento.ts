// Roteiro falado da tela "Acompanhar a área" (convenção §9).
import type { Acompanhamento, CoberturaSolo, Estrategia, Local } from '../../api/tipos';
import { NOME_MES, ROTULO_COBERTURA } from '../fluxo/rotulos';
import { dataPorExtenso, FRASE_ESTADO } from './frases';

export function roteiroAcompanhamento(
  d: Acompanhamento, estrategia: Estrategia | null, plano: CoberturaSolo | null, mes: number, local: Local
): string {
  const partes: string[] = [];
  partes.push(d.ponto_exemplo ? `Este é um exemplo, com uma área perto de ${local.municipio}.` : 'Estas são as fotos do satélite da sua área.');
  const ultima = d.fotos[0];
  if (!ultima) return [...partes, 'As nuvens cobriram a área em todas as fotos dos últimos meses. Tente de novo daqui a uns dias.'].join(' ');
  partes.push(`A última foto é de ${dataPorExtenso(ultima.data)}. O satélite viu: ${FRASE_ESTADO[ultima.estado].toLowerCase()}.`);
  if (plano && estrategia) {
    partes.push(`No caminho ${estrategia.nome.toLowerCase()}, em ${NOME_MES[mes - 1]} a terra deveria estar assim: ${ROTULO_COBERTURA[plano].nome.toLowerCase()}.`);
    const confere = d.confere_por_cobertura[plano];
    if (confere === true) partes.push('Está como o plano.');
    if (confere === false) partes.push('Está diferente do plano. Vá ver a área ou fale com o técnico.');
  }
  partes.push('Para voltar ao resumo, toque em voltar.');
  return partes.join(' ');
}
