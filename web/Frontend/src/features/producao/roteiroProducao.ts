// Roteiro falado da tela "Como foi a colheita" (convenção §9): frases curtas,
// sem sigla, terminando com o que fazer em seguida.
import type { PainelProducao } from '../../api/tipos';
import { FRASE_CHUVA, FRASE_COLHEITA, fraseCalor, fraseChuvaAno } from './frases';
import { tx } from '../../i18n/idioma';

export function roteiroProducao(p: PainelProducao, ehExemplo: boolean, culturaAtualId: string | null = null): string {
  const ano = p.culturas[0]?.ano ?? p.clima?.ano ?? null;
  const nomeLocal = p.municipio ?? (p.condado ? `${p.condado}, ${p.estado}` : tx('sua região', 'your region'));
  const partes: string[] = [
    tx(
      `${ehExemplo ? 'Exemplo da cidade de' : 'Números da área de'} ${nomeLocal}.${ano ? ` Como foi a colheita de ${ano}.` : ''}`,
      `${ehExemplo ? 'Example for the town of' : 'Numbers for the area of'} ${nomeLocal}.${ano ? ` How the ${ano} harvest went.` : ''}`
    )
  ];
  const sua = p.culturas.find(c => c.cultura_id === culturaAtualId);
  if (sua) partes.push(tx(`A sua lavoura, ${sua.nome.toLowerCase()}: ${FRASE_COLHEITA[sua.situacao].toLowerCase()}.`, `Your crop, ${sua.nome.toLowerCase()}: ${FRASE_COLHEITA[sua.situacao].toLowerCase()}.`));
  const outras = p.culturas.filter(c => c !== sua);
  if (outras.length)
    partes.push(
      `${sua ? (p.municipio ? tx('Outras lavouras da cidade', 'Other crops in the town') : tx('Outras lavouras do condado', 'Other crops in the county')) : tx('Na região', 'In the region')}:${outras.map(c => `${c.nome.toLowerCase()}, ${FRASE_COLHEITA[c.situacao].toLowerCase()}`).join('; ')}.`
    );
  if (p.clima) {
    const calor = fraseCalor(p.clima);
    partes.push(`${tx(`O tempo em ${p.clima.ano}.`, `The weather in ${p.clima.ano}.`)} ${FRASE_CHUVA[p.clima.situacao_chuva]}. ${fraseChuvaAno(p.clima)} ${calor.titulo}. ${calor.detalhe}.`);
  }
  partes.push(tx('Para seguir, toque em continuar.', 'To go on, tap continue.'));
  return partes.join(' ');
}
