import type { Analise, CorrecoesTalhao, PrioridadeId, ProblemaId } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { Icone } from '../../components/Icone';
import { AvisoEspecialistaPragas } from '../../components/AvisoEspecialistaPragas';
import { CarrosselEstrategias } from './CarrosselEstrategias';
import { vocabulario } from './vocabularioCultura';
import { PainelTalhao } from './PainelTalhao';

interface TelaEstrategiasProps {
  analise: Analise;
  prioridades: PrioridadeId[];
  /** Problemas marcados: cada caminho diz se ajuda neles. */
  problemas: ProblemaId[];
  /** Marcou "Tem praga ou nematoide": mostra o aviso de procurar um especialista. */
  marcouPraga: boolean;
  /** Cultura escolhida: os textos falam dela (vocabularioCultura). */
  culturaId: string | null;
  nomeCultura: string | null;
  aoAbrir: (estrategiaId: string) => void;
  aoCorrigir: (correcoes: CorrecoesTalhao) => void;
  aoVoltar: () => void;
  aoComparar: () => void;
}


export function TelaEstrategias({ analise, prioridades, problemas, marcouPraga, culturaId, nomeCultura, aoAbrir, aoCorrigir, aoVoltar, aoComparar }: TelaEstrategiasProps) {
  const v = vocabulario(culturaId, nomeCultura);
  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>{analise.estrategias.length} caminhos para {v.aPeriodo}</h1>

      {marcouPraga && <AvisoEspecialistaPragas />}

      {/* Um caminho por vez, passando para o lado; os medidores ficam em "Comparar". */}
      <CarrosselEstrategias estrategias={analise.estrategias} prioridades={prioridades} problemas={problemas} vocab={v} aoAbrir={aoAbrir} />

      {/* Depois dos caminhos: o que os mapas e a NASA dizem da terra e do clima, para quem quiser conferir. */}
      <PainelTalhao
        talhao={analise.talhao}
        geada={analise.geada}
        calor={analise.estresse_termico ?? null}
        climaMensal={analise.clima_mensal}
        precipitacaoExtrema={analise.precipitacao_extrema}
        tendenciaHidrica={analise.tendencia_hidrica}
        estresseVegetal={analise.estresse_vegetal ?? null}
        aoCorrigir={aoCorrigir}
      />

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        <button type="button" className="botao botao-primario" onClick={aoComparar}>
          Comparar <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
