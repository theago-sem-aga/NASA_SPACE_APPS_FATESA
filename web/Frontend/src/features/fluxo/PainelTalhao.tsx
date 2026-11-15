import { SelosFontes } from '../../components/SeloFonte';
import { useId, useState } from 'react';
import type { ClimaMensal, EstresseTermico, EstresseVegetal, CaracteristicasTalhao, CorrecoesTalhao, Nivel, Relevo, RiscoGeada, RiscoPrecipitacaoExtrema, TendenciaHidrica, TexturaSolo } from '../../api/tipos';
import { CartaoEscolha } from '../../components/CartaoEscolha';
import { Pictograma, type NomePictograma } from '../../components/Pictograma';
import { CarrosselClima } from './CarrosselClima';
import { FaixaCalor } from './FaixaCalor';
import { MesesAtencao } from './MesesAtencao';
import { FaixaGeada, nivelComFaixa } from './FaixaGeada';
import { FaixaPrecipitacaoExtrema } from './FaixaPrecipitacaoExtrema';
import { FaixaTendenciaHidrica, ROTULO_TENDENCIA } from './FaixaTendenciaHidrica';
import { FaixaEstresseVegetal, ROTULO_ESTRESSE } from './FaixaEstresseVegetal';
import { PICTO_RELEVO, PICTO_TEXTURA, ROTULO_RELEVO, ROTULO_RISCO, ROTULO_TEXTURA } from './rotulos';

interface PainelTalhaoProps {
  talhao: CaracteristicasTalhao;
  /** Detalhe mês a mês do risco de geada; null = sem dado. */
  geada: RiscoGeada | null;
  /** Calor forte histórico mês a mês; null/ausente = sem dado. */
  calor: EstresseTermico | null;
  /** Chuva média de cada mês, para "Meses de atenção". */
  climaMensal: ClimaMensal[];
  /** Dias de chuva extrema nos últimos 30; null = sem dado. */
  precipitacaoExtrema: RiscoPrecipitacaoExtrema | null;
  /** A chuva do ano vem caindo, subindo ou estável; null = sem dado. */
  tendenciaHidrica: TendenciaHidrica | null;
  /** A planta está tão verde quanto costuma estar nesta época; null = sem dado. */
  estresseVegetal: EstresseVegetal | null;
  aoCorrigir: (correcoes: CorrecoesTalhao) => void;
}

const TEXTURAS = Object.keys(ROTULO_TEXTURA) as TexturaSolo[];
const RELEVOS = Object.keys(ROTULO_RELEVO) as Relevo[];

function Item({ pictograma, rotulo, valor, corrigido }: { pictograma: NomePictograma; rotulo: string; valor: string; corrigido?: boolean }) {
  return (
    <li className="ficha">
      <Pictograma nome={pictograma} tamanho={36} />
      <span className="ficha-texto">
        <span className="ficha-rotulo">{rotulo}</span>
        <span className="ficha-valor">{valor}</span>
        {corrigido && <span className="etiqueta etiqueta-neutra">Você corrigiu</span>}
      </span>
    </li>
  );
}

/** Nome curto de cada base para a frase "De onde vem" (o back manda o nome técnico completo). */
function nomeBase(base: string): string {
  if (/power/i.test(base)) return 'NASA POWER (clima)';
  if (/srtm/i.test(base)) return 'NASA SRTM (relevo)';
  if (/3dep|usgs/i.test(base)) return 'USGS (relevo)';
  if (/modis/i.test(base)) return 'NASA MODIS (vegetação)';
  if (/soilgrids/i.test(base)) return 'SoilGrids (solo)';
  if (/usda/i.test(base)) return 'USDA (solo)';
  if (/grace/i.test(base)) return 'NASA GRACE (água no subsolo)';
  return base;
}

const risco = (n: Nivel | null) => (n ? ROTULO_RISCO[n] : 'Sem dado');

/**
 * O que os dados acharam sobre o talhão (solo, terreno, riscos), em vez de perguntar.
 * A pessoa pode discordar: em "Não é bem assim" ela marca a terra, o terreno ou os
 * dois, e só ao tocar em "Confirmar mudanças" a análise é refeita com a correção.
 */
export function PainelTalhao({ talhao, geada, calor, climaMensal, precipitacaoExtrema, tendenciaHidrica, estresseVegetal, aoCorrigir }: PainelTalhaoProps) {
  const id = useId();
  const [corrigindo, setCorrigindo] = useState(false);
  /** O que a pessoa marcou e ainda não confirmou. Começa igual ao que os mapas mostraram. */
  const [rascunho, setRascunho] = useState<CorrecoesTalhao>({});
  const texturaMarcada = rascunho.textura_solo ?? talhao.textura_solo;
  const relevoMarcado = rascunho.relevo ?? talhao.relevo;
  const mudancas: CorrecoesTalhao = {
    ...(texturaMarcada && texturaMarcada !== talhao.textura_solo ? { textura_solo: texturaMarcada } : {}),
    ...(relevoMarcado && relevoMarcado !== talhao.relevo ? { relevo: relevoMarcado } : {})
  };
  const temMudanca = Object.keys(mudancas).length > 0;
  const idAjuda = `${id}-ajuda-confirmar`;

  const abrir = () => {
    setRascunho({});
    setCorrigindo(true);
  };
  const cancelar = () => {
    setRascunho({});
    setCorrigindo(false);
  };
  const confirmar = () => {
    if (!temMudanca) return;
    setCorrigindo(false);
    aoCorrigir(mudancas);
  };

  const valorRelevo = talhao.relevo
    ? ROTULO_RELEVO[talhao.relevo].nome
    : 'Sem dado';

  return (
    <section className="cartao painel-talhao" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="titulo-secao">Sua terra, pelos mapas</h2>
      <ul className="fichas fichas-compactas">
        <Item
          pictograma={talhao.textura_solo ? PICTO_TEXTURA[talhao.textura_solo] : 'solo_sem_dado'}
          rotulo="Terra"
          valor={talhao.textura_solo ? ROTULO_TEXTURA[talhao.textura_solo].nome : 'Sem dado'}
          corrigido={talhao.fonte_textura === 'informado_produtor'}
        />
        <Item
          pictograma={talhao.relevo ? PICTO_RELEVO[talhao.relevo] : 'terreno_sem_dado'}
          rotulo="Terreno"
          valor={valorRelevo}
          corrigido={talhao.fonte_relevo === 'informado_produtor'}
        />
        <Item pictograma="falta_agua" rotulo="Risco de seca" valor={risco(talhao.risco_seca)} />
        <Item pictograma="erosao" rotulo="Risco de erosão" valor={risco(talhao.risco_erosao)} />
        <Item pictograma="geada" rotulo="Risco de geada" valor={geada ? nivelComFaixa(geada) : risco(talhao.risco_geada)} />
        <Item
          pictograma="chuva"
          rotulo="Chuva ao longo dos anos"
          valor={tendenciaHidrica ? ROTULO_TENDENCIA[tendenciaHidrica.tendencia] : 'Sem dado'}
        />
        <Item pictograma="planta" rotulo="Vegetação (NDVI)" valor={estresseVegetal ? ROTULO_ESTRESSE[estresseVegetal.situacao] : 'Sem dado'} />
      </ul>
      <div className="painel-talhao-rodape">
        {talhao.bases.length > 0 && <SelosFontes fontes={talhao.bases} />}
        {talhao.bases.length > 0 && <span className="texto-apoio">De onde vem: {[...new Set(talhao.bases.map(nomeBase))].join(', ')}.</span>}
        {!corrigindo && (
          <button type="button" className="link-discreto" onClick={abrir} aria-expanded={false}>
            Não é bem assim
          </button>
        )}
      </div>

      {corrigindo && (
        <div className="painel-correcao">
          <p className="texto-apoio">
            Você conhece a sua terra melhor que o satélite. Marque o que é certo: pode mudar só a terra, só o terreno ou os dois. Depois toque em confirmar.
          </p>
          <fieldset className="grade-escolhas grade-escolhas-3">
            <legend className="resumo-subtitulo">A terra é…</legend>
            {TEXTURAS.map(t => (
              <CartaoEscolha
                key={t}
                tipo="radio"
                nomeGrupo={`${id}-textura`}
                marcado={texturaMarcada === t}
                pictograma={PICTO_TEXTURA[t]}
                titulo={ROTULO_TEXTURA[t].nome}
                detalhe={ROTULO_TEXTURA[t].dica}
                aoMudar={() => setRascunho(r => ({ ...r, textura_solo: t }))}
              />
            ))}
          </fieldset>
          <fieldset className="grade-escolhas grade-escolhas-3">
            <legend className="resumo-subtitulo">O terreno é…</legend>
            {RELEVOS.map(r => (
              <CartaoEscolha
                key={r}
                tipo="radio"
                nomeGrupo={`${id}-relevo`}
                marcado={relevoMarcado === r}
                pictograma={PICTO_RELEVO[r]}
                titulo={ROTULO_RELEVO[r].nome}
                detalhe={ROTULO_RELEVO[r].dica}
                aoMudar={() => setRascunho(r0 => ({ ...r0, relevo: r }))}
              />
            ))}
          </fieldset>
          <div className="navegacao">
            <button type="button" className="botao botao-secundario" onClick={cancelar}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao-primario"
              onClick={confirmar}
              aria-disabled={!temMudanca || undefined}
              aria-describedby={temMudanca ? undefined : idAjuda}
            >
              Confirmar mudanças
            </button>
          </div>
          {!temMudanca && (
            <p id={idAjuda} className="texto-apoio">
              Marque a terra ou o terreno certo para poder confirmar.
            </p>
          )}
        </div>
      )}
      {/* Clima da área depois do "Não é bem assim", que é só de terra e terreno. Uma explicação por vez. */}
      <CarrosselClima
        slides={[
          ...(calor || geada
            ? [{ id: 'atencao', titulo: 'Meses de atenção', pictograma: 'seca' as const, conteudo: <MesesAtencao calor={calor} geada={geada} clima={climaMensal} /> }]
            : []),
          ...(calor ? [{ id: 'calor', titulo: 'Calor', pictograma: 'calor' as const, conteudo: <FaixaCalor calor={calor} /> }] : []),
          ...(geada ? [{ id: 'geada', titulo: 'Geada', pictograma: 'geada' as const, conteudo: <FaixaGeada geada={geada} /> }] : []),
          ...(precipitacaoExtrema
            ? [{ id: 'chuva-forte', titulo: 'Chuva forte', pictograma: 'chuva' as const, conteudo: <FaixaPrecipitacaoExtrema precipitacaoExtrema={precipitacaoExtrema} /> }]
            : []),
          ...(tendenciaHidrica
            ? [{ id: 'chuva-anos', titulo: 'Chuva ao longo dos anos', pictograma: 'chuva' as const, conteudo: <FaixaTendenciaHidrica tendencia={tendenciaHidrica} /> }]
            : []),
          ...(estresseVegetal
            ? [{ id: 'verdor', titulo: 'Vigor da vegetação (NDVI)', pictograma: 'planta' as const, conteudo: <FaixaEstresseVegetal estresse={estresseVegetal} /> }]
            : [])
        ]}
      />
    </section>
  );
}
