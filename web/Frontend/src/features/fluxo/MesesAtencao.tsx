import { Termo } from '../../components/Termo';
import { SeloFonte } from '../../components/SeloFonte';
import type { ClimaMensal, EstresseTermico, RiscoGeada } from '../../api/tipos';
import { NOME_MES, NOME_MES_CURTO } from './rotulos';
import { L, traduzivel, tx } from '../../i18n/idioma';

/** Mês com menos chuva que isto aparece como "pouca chuva". Proposta, a validar com a equipe. */
const POUCA_CHUVA_MM = 50;

type Alerta = 'calor' | 'geada' | 'seca';

const ROTULO: Record<Alerta, string> = traduzivel({ calor: L('Calor forte', 'Strong heat'), geada: L('Geada', 'Frost'), seca: L('Pouca chuva', 'Little rain') });

/**
 * "Meses de atenção": junta, mês a mês, o que os outros itens já mostram
 * (calor forte, geada e pouca chuva), para ver num olhar quando a lavoura sofre mais.
 * Não cria regra nova: só reúne os meses de risco que vêm do backend e a chuva média do mês.
 * BACKEND: o desafio pede "estações de maior vulnerabilidade da cultura atual"; quando o back
 * calcular isso por cultura (fases sensíveis), esta tela deve passar a usar esse resultado.
 */
export function MesesAtencao({ calor, geada, clima }: { calor: EstresseTermico | null; geada: RiscoGeada | null; clima: ClimaMensal[] }) {
  const alertas = (mes: number): Alerta[] => {
    const lista: Alerta[] = [];
    if (calor?.meses_com_risco.includes(mes)) lista.push('calor');
    if (geada?.meses_com_risco.includes(mes)) lista.push('geada');
    const chuva = clima.find(c => c.mes === mes)?.precipitacao_acumulada_mm;
    if (chuva !== null && chuva !== undefined && chuva < POUCA_CHUVA_MM) lista.push('seca');
    return lista;
  };
  const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, alertas: alertas(i + 1) }));
  const comAlerta = meses.filter(m => m.alertas.length > 0);
  const resumo =
    comAlerta.length === 0
      ? tx('Nenhum mês com calor forte, geada ou pouca chuva no histórico.', 'No month with strong heat, frost or little rain in the record.')
      : tx(
          `${comAlerta.length} meses pedem atenção. Os mais delicados são os que juntam mais de um problema.`,
          `${comAlerta.length} months need attention. The most delicate ones combine more than one problem.`
        );

  return (
    <div className="meses-atencao">
      <p className="faixa-geada-frase">{resumo}</p>
      <SeloFonte fonte={calor?.fonte ?? geada?.fonte} />
      <ol className="meses-atencao-lista">
        {meses.map(m => (
          <li key={m.mes} className={`meses-atencao-mes${m.alertas.length ? ' com-alerta' : ''}`}>
            <span className="meses-atencao-nome">
              <span aria-hidden="true">{NOME_MES_CURTO[m.mes - 1]}</span>
              <span className="visualmente-oculto">{NOME_MES[m.mes - 1]}</span>
            </span>
            <span className="meses-atencao-alertas">
              {m.alertas.length === 0 ? (
                <span className="meses-atencao-ok">{tx('sem alerta', 'no alert')}</span>
              ) : (
                m.alertas.map(a => (
                  <span key={a} className={`etiqueta meses-atencao-${a}`}>
                    {ROTULO[a]}
                  </span>
                ))
              )}
            </span>
          </li>
        ))}
      </ol>
      <details className="como-ler">
        <summary>{tx('Como ler este dado', 'How to read this')}</summary>
        <p className="termos-relacionados">{tx('Palavras deste quadro:', 'Words in this box:')} <Termo id="evapotranspiracao" /> <Termo id="balanco_hidrico" /></p>
        <p className="texto-apoio">
          {tx(
            `Calor forte e geada: meses de risco dos itens "Calor" e "Geada". Pouca chuva: mês com menos de ${POUCA_CHUVA_MM} mm de chuva em média (NASA POWER). É um retrato do clima da área, não da fase da sua lavoura: a fase mais sensível de cada cultura ainda precisa ser cruzada com isso.`,
            `Strong heat and frost: risk months from the "Heat" and "Frost" boxes. Little rain: a month with less than ${POUCA_CHUVA_MM} mm of rain on average (NASA POWER). It is a picture of the area’s climate, not of your crop’s growth stage: the most sensitive stage of each crop still needs to be matched against it.`
          )}
        </p>
      </details>
    </div>
  );
}
