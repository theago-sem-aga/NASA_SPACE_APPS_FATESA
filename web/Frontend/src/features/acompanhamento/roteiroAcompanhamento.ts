// Roteiro falado da tela "Acompanhar a área" (convenção §9).
import type { Acompanhamento, CoberturaSolo, Estrategia, Local, PrevisaoClima } from '../../api/tipos';
import { FRASE_CHUVA_MES, FRASE_PREVISAO_CALOR, FRASE_PREVISAO_CHUVA } from '../producao/frases';
import { NOME_MES, ROTULO_COBERTURA } from '../fluxo/rotulos';
import { dataPorExtenso, FRASE_ESTADO } from './frases';

export function roteiroAcompanhamento(
  d: Acompanhamento, estrategia: Estrategia | null, plano: CoberturaSolo | null, mes: number, local: Local,
  previsao: PrevisaoClima | null = null
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
  if (previsao) {
    partes.push(`A chuva dos próximos meses. É previsão: pode mudar. ${FRASE_PREVISAO_CHUVA[previsao.chuva]}. ${FRASE_PREVISAO_CALOR[previsao.temperatura]}.`);
    previsao.meses.forEach(m => partes.push(`${m.nome}: ${FRASE_CHUVA_MES[m.chuva].toLowerCase()}.`));
  }
  partes.push('Para ver o resumo, toque em ver meu resumo.');
  return partes.join(' ');
}
