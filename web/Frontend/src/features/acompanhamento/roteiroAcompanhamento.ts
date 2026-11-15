// Roteiro falado da tela "Acompanhar a área" (convenção §9).
import type { Acompanhamento, CoberturaSolo, Estrategia, Local, PrevisaoClima } from '../../api/tipos';
import { FRASE_CHUVA_MES, FRASE_PREVISAO_CALOR, FRASE_PREVISAO_CHUVA } from '../producao/frases';
import { NOME_MES, ROTULO_COBERTURA } from '../fluxo/rotulos';
import { dataPorExtenso, FRASE_ESTADO } from './frases';
import { tx } from '../../i18n/idioma';

export function roteiroAcompanhamento(
  d: Acompanhamento, estrategia: Estrategia | null, plano: CoberturaSolo | null, mes: number, local: Local,
  previsao: PrevisaoClima | null = null
): string {
  const partes: string[] = [];
  partes.push(
    d.ponto_exemplo
      ? tx(`Este é um exemplo, com uma área perto de ${local.municipio}.`, `This is an example, with an area near ${local.municipio}.`)
      : tx('Estas são as fotos do satélite da sua área.', 'These are the satellite images of your field.')
  );
  const ultima = d.fotos[0];
  if (!ultima)
    return [...partes, tx('As nuvens cobriram a área em todas as fotos dos últimos meses. Tente de novo daqui a uns dias.', 'Clouds covered the area in every image of the last months. Try again in a few days.')].join(' ');
  partes.push(
    tx(
      `A última foto é de ${dataPorExtenso(ultima.data)}. O satélite viu: ${FRASE_ESTADO[ultima.estado].toLowerCase()}.`,
      `The latest image is from ${dataPorExtenso(ultima.data)}. The satellite saw: ${FRASE_ESTADO[ultima.estado].toLowerCase()}.`
    )
  );
  if (plano && estrategia) {
    partes.push(
      tx(
        `No caminho ${estrategia.nome.toLowerCase()}, em ${NOME_MES[mes - 1]} a terra deveria estar assim: ${ROTULO_COBERTURA[plano].nome.toLowerCase()}.`,
        `With the option ${estrategia.nome.toLowerCase()}, in ${NOME_MES[mes - 1]} the field should look like this: ${ROTULO_COBERTURA[plano].nome.toLowerCase()}.`
      )
    );
    const confere = d.confere_por_cobertura[plano];
    if (confere === true) partes.push(tx('Está como o plano.', 'It matches the plan.'));
    if (confere === false) partes.push(tx('Está diferente do plano. Vá ver a área ou fale com o técnico.', 'It differs from the plan. Go see the field or talk to your advisor.'));
  }
  if (previsao) {
    partes.push(
      `${tx('A chuva dos próximos meses. É previsão: pode mudar.', 'Rain in the coming months. It is a forecast: it can change.')} ${FRASE_PREVISAO_CHUVA[previsao.chuva]}. ${FRASE_PREVISAO_CALOR[previsao.temperatura]}.`
    );
    previsao.meses.forEach(m => partes.push(`${m.nome}: ${FRASE_CHUVA_MES[m.chuva].toLowerCase()}.`));
  }
  partes.push(tx('Para ver o resumo, toque em ver meu resumo.', 'To see the summary, tap see my summary.'));
  return partes.join(' ');
}
