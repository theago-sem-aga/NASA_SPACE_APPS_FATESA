import { SINALIZAR_MOCK } from '../../api/cliente';
import type { Analise, CorrecoesTalhao, PrioridadeId } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { Icone } from '../../components/Icone';
import { AvisoEspecialistaPragas } from '../../components/AvisoEspecialistaPragas';
import { CarrosselEstrategias } from './CarrosselEstrategias';
import { vocabulario } from './vocabularioCultura';
import { PainelTalhao } from './PainelTalhao';

interface TelaEstrategiasProps {
  analise: Analise;
  prioridades: PrioridadeId[];
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


export function TelaEstrategias({ analise, prioridades, marcouPraga, culturaId, nomeCultura, aoAbrir, aoCorrigir, aoVoltar, aoComparar }: TelaEstrategiasProps) {
  const v = vocabulario(culturaId, nomeCultura);
  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>{analise.estrategias.length} caminhos para {v.aPeriodo}</h1>
      {analise.eh_mock && SINALIZAR_MOCK && <p className="texto-apoio">Nesta demonstração a ordem é sempre a mesma.</p>}

      <PainelTalhao
        talhao={analise.talhao}
        geada={analise.geada}
        precipitacaoExtrema={analise.precipitacao_extrema}
        tendenciaHidrica={analise.tendencia_hidrica}
        aoCorrigir={aoCorrigir}
      />


      {marcouPraga && <AvisoEspecialistaPragas />}

      {/* Um caminho por vez, passando para o lado; os medidores ficam em "Comparar". */}
      <CarrosselEstrategias estrategias={analise.estrategias} prioridades={prioridades} vocab={v} aoAbrir={aoAbrir} />

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
