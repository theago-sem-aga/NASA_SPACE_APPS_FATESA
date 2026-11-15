import type { Estrategia } from '../api/tipos';
import { L, traduzivel, tx } from '../i18n/idioma';

/**
 * Nome científico das plantas, mostrado em itálico embaixo do nome popular.
 * Ajuda quem conhece a planta pelo nome formal (agrônomo, técnico, estudante)
 * sem atrapalhar quem lê só o nome comum.
 *
 * Etapas que não são planta ('pousio' = terra parada, 'palhada' = palha) e o pasto
 * (que pode ser de várias espécies) ficam sem nome científico de propósito.
 */
export const NOME_CIENTIFICO: Record<string, string> = {
  // Cana comercial é híbrido de várias espécies do gênero: por isso "spp.".
  cana_de_acucar: 'Saccharum spp.',
  soja: 'Glycine max',
  milho: 'Zea mays',
  mandioca: 'Manihot esculenta',
  trigo: 'Triticum aestivum',
  amendoim: 'Arachis hypogaea',
  // O caminho cita duas espécies (juncea e spectabilis).
  crotalaria: 'Crotalaria spp.',
  milheto: 'Pennisetum glaucum',
  sorgo_forrageiro: 'Sorghum bicolor',
  // Mucuna-preta.
  mucuna: 'Mucuna aterrima'
};

/** Quando o nome do caminho cita mais de uma planta, o nome científico cita todas. */
const NOME_CIENTIFICO_CAMINHO: Record<string, string> = traduzivel({
  crotalaria: L('Crotalaria juncea ou C. spectabilis', 'Crotalaria juncea or C. spectabilis'),
  mucuna: L('Mucuna aterrima ou Canavalia ensiformis', 'Mucuna aterrima or Canavalia ensiformis')
});

/** Partes que, pela regra de nomenclatura, não vão em itálico. */
const SEM_ITALICO = new Set(['spp.', 'sp.', 'ou', 'e', 'or', 'and']);

/** Gênero e espécie em itálico; "spp." e "ou" em texto normal. `lang="la"` ajuda o leitor de tela. */
export function TextoCientifico({ texto }: { texto: string }) {
  const partes = texto.split(/(\s+)/);
  return (
    <span className="nome-cientifico" lang="la">
      {partes.map((p, i) => (p.trim() && !SEM_ITALICO.has(p) ? <i key={i}>{p}</i> : <span key={i} lang={SEM_ITALICO.has(p) ? tx('pt-BR', 'en') : undefined}>{p}</span>))}
    </span>
  );
}

/** Nome científico de uma cultura pelo id. Não mostra nada se não houver. */
export function NomeCientifico({ culturaId }: { culturaId: string | null | undefined }) {
  const texto = culturaId ? NOME_CIENTIFICO[culturaId] : undefined;
  return texto ? <TextoCientifico texto={texto} /> : null;
}

/** A planta que o caminho põe entre um plantio e outro (diferente da cultura atual, que é a primeira etapa). */
export function plantaDoCaminho(e: Estrategia) {
  const atual = e.etapas_rotacao[0]?.cultura_id;
  return e.etapas_rotacao.find(x => x.cultura_id !== atual && NOME_CIENTIFICO[x.cultura_id]) ?? null;
}

/** Nome científico da planta principal de um caminho (ex.: "Plantar amendoim…" → Arachis hypogaea). */
export function NomeCientificoCaminho({ estrategia }: { estrategia: Estrategia }) {
  const planta = plantaDoCaminho(estrategia);
  const texto = planta ? (NOME_CIENTIFICO_CAMINHO[planta.cultura_id] ?? NOME_CIENTIFICO[planta.cultura_id]) : undefined;
  return texto ? <TextoCientifico texto={texto} /> : null;
}
