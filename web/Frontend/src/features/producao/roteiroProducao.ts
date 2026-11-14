// Roteiro falado da tela "Como foi a colheita" (convenção §9): frases curtas,
// sem sigla, terminando com o que fazer em seguida.
import type { PainelProducao } from '../../api/tipos';
import { FRASE_CHUVA, FRASE_CHUVA_MES, FRASE_COLHEITA, FRASE_PREVISAO_CALOR, FRASE_PREVISAO_CHUVA, fraseCalor } from './frases';

export function roteiroProducao(p: PainelProducao, ehExemplo: boolean): string {
  const ano = p.culturas[0]?.ano ?? p.clima.ano;
  const partes: string[] = [];
  partes.push(`${ehExemplo ? 'Exemplo da cidade de' : 'Números da cidade de'} ${p.municipio}.`);
  partes.push(`Como foi a colheita de ${ano}.`);
  p.culturas.forEach(c => partes.push(`${c.nome}: ${FRASE_COLHEITA[c.situacao].toLowerCase()}.`));
  const calor = fraseCalor(p.clima);
  partes.push(`O tempo em ${p.clima.ano}. ${FRASE_CHUVA[p.clima.situacao_chuva]}: de cada 10 chuvas, caíram ${p.clima.gotas_em_10}. ${calor.titulo}. ${calor.detalhe}.`);
  const pv = p.previsao;
  if (pv) {
    partes.push(`Agora, a previsão para os próximos meses. É previsão: pode mudar. ${FRASE_PREVISAO_CHUVA[pv.chuva]}. ${FRASE_PREVISAO_CALOR[pv.temperatura]}.`);
    pv.meses.forEach(m => partes.push(`${m.nome}: ${FRASE_CHUVA_MES[m.chuva].toLowerCase()}.`));
    partes.push(`O que fazer. ${pv.dicas.map(d => d.frase).join('. ')}.`);
  }
  partes.push('Antes de decidir, converse com o técnico. Quando quiser seguir, toque em continuar.');
  return partes.join(' ');
}
