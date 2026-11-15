import { GaleriaFotos } from '../../components/GaleriaFotos';
import { Icone } from '../../components/Icone';
import { GALERIA_INICIO } from '../../components/imagens';
import { Pictograma } from '../../components/Pictograma';
import { DicaPermissao } from '../../components/DicaPermissao';
import type { SituacaoGps } from './useLocalizacao';
import { tx } from '../../i18n/idioma';

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
      <h1 tabIndex={-1}>
        {tx(
          'Vai trocar ou renovar a lavoura? Veja o que fazer com a terra até o próximo plantio.',
          'Switching or renewing your crop? See what to do with the land until the next planting.'
        )}
      </h1>
      <ul className="tres-pontos" aria-label={tx('O que você vai ver', 'What you will see')}>
        <li><Pictograma nome="agua" tamanho={48} /> {tx('Chuva', 'Rain')}</li>
        <li><Pictograma nome="crotalaria" tamanho={48} /> {tx('Sugestão de cultura', 'Crop suggestion')}</li>
        <li><span className="tres-pontos-icone"><Icone nome="pessoa" tamanho={28} /></span> {tx('Orientação', 'Guidance')}</li>
      </ul>

      <div className="entrada-local">
        <button type="button" className="botao botao-primario botao-gigante" onClick={aoUsarLocalizacao} disabled={ocupado}>
          <Icone nome="local" tamanho={28} />
          {situacaoGps === 'pedindo'
            ? tx('Procurando onde você está…', 'Finding where you are…')
            : situacaoGps === 'achando_cidade'
              ? tx('Achando a cidade…', 'Finding the town…')
              : tx('Usar onde estou agora', 'Use my current location')}
        </button>
        {mostrarDica && <DicaPermissao />}
        <p className="texto-apoio entrada-local-apoio">
          {tx(
            'Se estiver na plantação, melhor ainda: a gente vê a chuva e a terra exatamente daí. A localização só serve para isso.',
            'If you are in the field, even better: we look at the rain and the soil right there. Your location is used only for that.'
          )}
        </p>
        <button type="button" className="link-discreto" onClick={aoDigitarCidade}>
          {tx('Prefiro escrever a cidade', 'I’d rather type the town')}
        </button>
      </div>


      <GaleriaFotos fotos={GALERIA_INICIO} rotulo={tx('Fotos de lavouras no Brasil', 'Photos of farm fields in Brazil')} />
    </>
  );
}
