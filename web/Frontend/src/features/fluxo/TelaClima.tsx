import { SeloFonte } from '../../components/SeloFonte';
import type { Analise, Estrategia } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { GraficoClima } from '../../components/GraficoClima';
import { GraficoRosca } from '../../components/GraficoRosca';
import { Pictograma } from '../../components/Pictograma';
import { Navegacao } from '../../components/Navegacao';
import { Termo } from '../../components/Termo';
import { NOME_MES, ROTULO_TIPO_DADO, anoDe, formatarNumero } from './rotulos';
import { tx } from '../../i18n/idioma';

interface TelaClimaProps {
  analise: Analise;
  estrategia: Estrategia;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

const juntar = (itens: string[]) =>
  itens.length <= 1 ? itens.join('') : `${itens.slice(0, -1).join(', ')} ${tx('e', 'and')} ${itens[itens.length - 1]}`;

export function TelaClima({ analise, estrategia, aoVoltar, aoAvancar }: TelaClimaProps) {
  const fonte = analise.fonte_clima;
  const ordemMeses = estrategia.calendario.map(m => m.mes);
  const descobertos = new Set(estrategia.calendario.filter(m => m.cobertura === 'solo_descoberto').map(m => m.mes));

  // Apenas aritmética sobre os dados recebidos: quanto da chuva do ano cai nos meses de solo descoberto.
  const chuvas = analise.clima_mensal.filter(c => c.precipitacao_acumulada_mm !== null);
  const total = chuvas.reduce((s, c) => s + (c.precipitacao_acumulada_mm ?? 0), 0);
  const noDescoberto = chuvas.filter(c => descobertos.has(c.mes)).reduce((s, c) => s + (c.precipitacao_acumulada_mm ?? 0), 0);
  const percentual = total > 0 ? Math.round((noDescoberto / total) * 100) : null;
  const nomesDescobertos = ordemMeses.filter(m => descobertos.has(m)).map(m => NOME_MES[m - 1]);

  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>{tx('Como costuma chover aí', 'How it usually rains there')}</h1>
      <SeloFonte fonte={fonte.fonte_id} />
      <p className="texto-apoio">
        {fonte.tipo_dado === 'observacao_historica'
          ? tx(
              `Média de ${anoDe(fonte.periodo_inicio)} a ${anoDe(fonte.periodo_fim)}, medida pela NASA. Não é previsão.`,
              `Average from ${anoDe(fonte.periodo_inicio)} to ${anoDe(fonte.periodo_fim)}, measured by NASA. It is not a forecast.`
            )
          : tx(
              `Atenção: isto é ${ROTULO_TIPO_DADO[fonte.tipo_dado].toLowerCase()}, não o que já aconteceu.`,
              `Note: this is a ${ROTULO_TIPO_DADO[fonte.tipo_dado].toLowerCase()}, not what has already happened.`
            )}{' '}
        <Termo id="satelite_estacao">{tx('Como a NASA mede', 'How NASA measures')}</Termo>
      </p>

      {descobertos.size > 0 && percentual !== null ? (
        <p className="destaque destaque-atencao destaque-rosca">
          <span className="rosca-com-figura">
            <GraficoRosca percentual={percentual} cor="#a14b0b" />
            <Pictograma nome="terra_descoberta" tamanho={40} />
          </span>
          <span>
            <strong>{tx(`${percentual}% da chuva do ano`, `${percentual}% of the year’s rain`)}</strong>{' '}
            {tx(
              `cai com a terra descoberta, de ${nomesDescobertos[0]} a ${nomesDescobertos[nomesDescobertos.length - 1]}`,
              `falls on bare soil, from ${nomesDescobertos[0]} to ${nomesDescobertos[nomesDescobertos.length - 1]}`
            )}
            <span className="visualmente-oculto"> ({juntar(nomesDescobertos)}, {formatarNumero(noDescoberto)} mm)</span>.
          </span>
        </p>
      ) : (
        <p className="destaque destaque-positivo">
          <Pictograma nome="palhada" tamanho={48} />
          <span>
            {tx('Nesse caminho a terra fica', 'With this option the soil stays')} <strong>{tx('coberta o ano todo', 'covered all year')}</strong>
            {tx(', mesmo na chuva forte.', ', even in heavy rain.')}
          </span>
        </p>
      )}

      <GraficoClima
        clima={analise.clima_mensal}
        ordemMeses={ordemMeses}
        mesesDestacados={descobertos}
        rotuloDestaque={tx('terra descoberta', 'bare soil')}
      />

      <Navegacao aoVoltar={aoVoltar} aoAvancar={aoAvancar} rotuloAvancar={tx('Antes de decidir', 'Before you decide')} />
    </>
  );
}
