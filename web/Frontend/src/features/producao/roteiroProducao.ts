// Roteiro falado da tela "Como foi a colheita" (convenção §9): frases curtas,
// sem sigla, terminando com o que fazer em seguida.
import type { PainelProducao } from '../../api/tipos';
import { FRASE_CHUVA, FRASE_COLHEITA, fraseCalor, fraseChuvaAno } from './frases';

export function roteiroProducao(p: PainelProducao, ehExemplo: boolean, culturaAtualId: string | null = null): string {
  const ano = p.culturas[0]?.ano ?? p.clima.ano;
  const partes: string[] = [`${ehExemplo ? 'Exemplo da cidade de' : 'Números da cidade de'} ${p.municipio}. Como foi a colheita de ${ano}.`];
  const sua = p.culturas.find(c => c.cultura_id === culturaAtualId);
  if (sua) partes.push(`A sua lavoura, ${sua.nome.toLowerCase()}: ${FRASE_COLHEITA[sua.situacao].toLowerCase()}.`);
  const outras = p.culturas.filter(c => c !== sua);
  if (outras.length) partes.push(`${sua ? 'Outras lavouras da cidade' : 'Na cidade'}: ${outras.map(c => `${c.nome.toLowerCase()}, ${FRASE_COLHEITA[c.situacao].toLowerCase()}`).join('; ')}.`);
  const calor = fraseCalor(p.clima);
  partes.push(`O tempo em ${p.clima.ano}. ${FRASE_CHUVA[p.clima.situacao_chuva]}. ${fraseChuvaAno(p.clima)} ${calor.titulo}. ${calor.detalhe}.`);
  partes.push('Para seguir, toque em continuar.');
  return partes.join(' ');
}
