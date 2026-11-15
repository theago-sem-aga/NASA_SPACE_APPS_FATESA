import { GaleriaFotos } from '../../components/GaleriaFotos';
import { Icone } from '../../components/Icone';
import { GALERIA_INICIO } from '../../components/imagens';
import { Pictograma } from '../../components/Pictograma';
import { DicaPermissao } from '../../components/DicaPermissao';
import type { SituacaoGps } from './useLocalizacao';

interface TelaInicioProps {
  situacaoGps: SituacaoGps;
  mostrarDica: boolean;
  aoUsarLocalizacao: () => void;
  aoDigitarCidade: () => void;
}

/** Primeira tela: já é a entrada pela localização. Um botão grande e uma saída discreta. */
export function TelaInicio({ situacaoGps, mostrarDica, aoUsarLocalizacao, aoDigitarCidade }: TelaInicioProps) {
  const ocupado = situacaoGps !== 'parado';
  return (
    <>
      <h1 tabIndex={-1}>Vai trocar ou renovar a lavoura? Veja o que fazer com a terra até o próximo plantio.</h1>
      <ul className="tres-pontos" aria-label="O que você vai ver">
        <li><Pictograma nome="agua" tamanho={48} /> Chuva</li>
        <li><Pictograma nome="crotalaria" tamanho={48} /> Sugestão de cultura</li>
        <li><span className="tres-pontos-icone"><Icone nome="pessoa" tamanho={28} /></span> Orientação</li>
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


      <GaleriaFotos fotos={GALERIA_INICIO} rotulo="Fotos de lavouras no Brasil" />
    </>
  );
}
