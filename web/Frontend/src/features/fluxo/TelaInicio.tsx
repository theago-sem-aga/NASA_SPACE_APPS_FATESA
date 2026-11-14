import { Foto } from '../../components/Foto';
import { Icone } from '../../components/Icone';
import { IMAGENS } from '../../components/imagens';
import { Pictograma } from '../../components/Pictograma';
import { DicaPermissao } from '../../components/DicaPermissao';
import type { SituacaoGps } from './useLocalizacao';

interface TelaInicioProps {
  situacaoGps: SituacaoGps;
  mostrarDica: boolean;
  aoUsarLocalizacao: () => void;
  aoDigitarCidade: () => void;
  aoVerColheita: () => void;
}

/** Primeira tela: já é a entrada pela localização. Um botão grande e uma saída discreta. */
export function TelaInicio({ situacaoGps, mostrarDica, aoUsarLocalizacao, aoDigitarCidade, aoVerColheita }: TelaInicioProps) {
  const ocupado = situacaoGps !== 'parado';
  return (
    <>
      <h1 tabIndex={-1}>Vai reformar o canavial? Veja o que fazer com a terra até plantar de novo.</h1>
      <ul className="tres-pontos" aria-label="O que você vai ver">
        <li><Pictograma nome="agua" tamanho={48} /> Como chove aí</li>
        <li><Pictograma nome="crotalaria" tamanho={48} /> 3 caminhos</li>
        <li><span className="tres-pontos-icone"><Icone nome="pessoa" tamanho={28} /></span> O que perguntar ao agrônomo</li>
      </ul>

      <div className="entrada-local">
        <button type="button" className="botao botao-primario botao-gigante" onClick={aoUsarLocalizacao} disabled={ocupado}>
          <Icone nome="local" tamanho={28} />
          {situacaoGps === 'pedindo' ? 'Procurando onde você está…' : situacaoGps === 'achando_cidade' ? 'Achando a cidade…' : 'Usar onde estou agora'}
        </button>
        {mostrarDica && <DicaPermissao />}
        <p className="texto-apoio entrada-local-apoio">
          Se estiver na plantação, melhor ainda: a gente vê a chuva e a terra exatamente daí. A localização só serve para isso.
        </p>
        <button type="button" className="link-discreto" onClick={aoDigitarCidade}>
          Prefiro escrever a cidade
        </button>
      </div>


      <button type="button" className="atalho-colheita" onClick={aoVerColheita}>
        <Pictograma nome="saco" tamanho={48} />
        <span>
          <strong>Como foi a colheita na cidade</strong>
          <span className="texto-apoio">Chuva, calor e o que esperar do próximo ano</span>
        </span>
        <Icone nome="seguir" />
      </button>

      <Foto imagem={IMAGENS.orbita} classe="foto-destaque" legenda="Plantações no Brasil vistas da Estação Espacial Internacional." />
    </>
  );
}
