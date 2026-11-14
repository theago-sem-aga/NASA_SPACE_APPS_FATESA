// Roteiro falado da tela "Como foi a colheita" (convenção §9): frases curtas,
// sem sigla, terminando com o que fazer em seguida.
import type { CenarioId, PainelProducao } from '../../api/tipos';
import { FRASE_CHUVA, FRASE_COLHEITA, fraseCalor, fraseCenario } from './frases';

export function roteiroProducao(p: PainelProducao, cenario: CenarioId, ehExemplo: boolean): string {
  const ano = p.culturas[0]?.ano ?? p.clima.ano;
  const partes: string[] = [];
  partes.push(`${ehExemplo ? 'Exemplo da cidade de' : 'Números da cidade de'} ${p.municipio}.`);
  partes.push(`Como foi a colheita de ${ano}.`);
  p.culturas.forEach(c => partes.push(`${c.nome}: ${FRASE_COLHEITA[c.situacao].toLowerCase()}.`));
  const calor = fraseCalor(p.clima);
  partes.push(`O tempo em ${p.clima.ano}. ${FRASE_CHUVA[p.clima.situacao_chuva]}: de cada 10 chuvas, caíram ${p.clima.gotas_em_10}. ${calor.titulo}. ${calor.detalhe}.`);
  const esc = p.cenarios.find(c => c.cenario_id === cenario);
  if (esc) {
    partes.push(`Se o próximo ano for ${esc.nome.replace('Ano ', '').toLowerCase()}:`);
    esc.culturas.forEach(r => {
      const nome = p.culturas.find(c => c.cultura_id === r.cultura_id)?.nome ?? r.cultura_id;
      partes.push(`${nome}, ${fraseCenario(r.sacos_em_100).toLowerCase()}.`);
    });
  }
  partes.push('Para ver outro tipo de ano, toque em seco, normal ou chuvoso. Quando quiser seguir, toque em continuar.');
  return partes.join(' ');
}
