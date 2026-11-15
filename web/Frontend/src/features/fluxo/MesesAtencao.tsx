import { Termo } from '../../components/Termo';
import { SeloFonte } from '../../components/SeloFonte';
import type { ClimaMensal, EstresseTermico, RiscoGeada } from '../../api/tipos';
import { NOME_MES, NOME_MES_CURTO } from './rotulos';

/** Mês com menos chuva que isto aparece como "pouca chuva". Proposta, a validar com a equipe. */
const POUCA_CHUVA_MM = 50;

type Alerta = 'calor' | 'geada' | 'seca';

const ROTULO: Record<Alerta, string> = { calor: 'Calor forte', geada: 'Geada', seca: 'Pouca chuva' };

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
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const chuva = clima.find(c => c.mes === mes)?.precipitacao_acumulada_mm;
    const incompleto = !calor?.meses.some(m => m.mes === mes)
      || !geada?.meses.some(m => m.mes === mes) || chuva === null || chuva === undefined;
    return { mes, alertas: alertas(mes), incompleto };
  });
  const comAlerta = meses.filter(m => m.alertas.length > 0);
  const dadosIncompletos = meses.some(m => m.incompleto);
  const resumo =
    comAlerta.length === 0
      ? dadosIncompletos
        ? 'Não há alertas nos dados disponíveis. Faltam dados para avaliar todos os riscos.'
        : 'Nenhum mês com calor forte, geada ou pouca chuva no histórico.'
      : `${comAlerta.length} meses pedem atenção. Os mais delicados são os que juntam mais de um problema.`;

  return (
    <div className="meses-atencao">
      <p className="faixa-geada-frase">{resumo}</p>
      {dadosIncompletos && comAlerta.length > 0 && (
        <p className="texto-apoio">Avaliação parcial: os riscos sem dados não estão incluídos.</p>
      )}
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
                <span className="meses-atencao-ok">{m.incompleto ? 'dados incompletos' : 'sem alerta'}</span>
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
        <summary>Como ler este dado</summary>
        <p className="termos-relacionados">Palavras deste quadro: <Termo id="evapotranspiracao" /> <Termo id="balanco_hidrico" /></p>
        <p className="texto-apoio">
          Calor forte e geada: meses de risco dos itens "Calor" e "Geada". Pouca chuva: mês com menos de {POUCA_CHUVA_MM} mm de chuva
          em média (NASA POWER). É um retrato do clima da área, não da fase da sua lavoura: a fase mais sensível de cada cultura ainda
          precisa ser cruzada com isso.
        </p>
      </details>
    </div>
  );
}
