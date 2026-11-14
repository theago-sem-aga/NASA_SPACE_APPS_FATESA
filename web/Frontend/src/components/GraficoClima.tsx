import { useId, useState } from 'react';
import type { ClimaMensal } from '../api/tipos';
import { NOME_MES, NOME_MES_CURTO, formatarNumero } from '../features/fluxo/rotulos';

type Variavel = 'chuva' | 'umidade';

interface GraficoClimaProps {
  clima: ClimaMensal[];
  /** Ordem dos meses no eixo (mesma do calendário da estratégia). */
  ordemMeses: number[];
  /** Meses marcados embaixo da barra (ex.: solo descoberto). */
  mesesDestacados: Set<number>;
  rotuloDestaque: string;
}

const CONFIG: Record<Variavel, { titulo: string; unidade: string; explicacao: string; valor: (c: ClimaMensal) => number | null; formatar: (v: number) => string }> = {
  chuva: {
    titulo: 'Chuva',
    unidade: 'mm',
    explicacao: '1 mm é 1 litro de água em cada metro quadrado.',
    valor: c => c.precipitacao_acumulada_mm,
    formatar: v => `${formatarNumero(v)} mm`
  },
  umidade: {
    titulo: 'Umidade da terra',
    unidade: 'de 0 a 1',
    explicacao: 'Água na terra, na altura da raiz: 0 é seca, 1 é encharcada.',
    valor: c => c.umidade_solo,
    formatar: v => formatarNumero(v)
  }
};

export function GraficoClima({ clima, ordemMeses, mesesDestacados, rotuloDestaque }: GraficoClimaProps) {
  const [variavel, setVariavel] = useState<Variavel>('chuva');
  const idDescricao = useId();
  const cfg = CONFIG[variavel];
  const porMes = new Map(clima.map(c => [c.mes, c]));
  const valores = ordemMeses.map(m => {
    const c = porMes.get(m);
    return { mes: m, valor: c ? cfg.valor(c) : null };
  });
  const maximo = Math.max(...valores.map(v => v.valor ?? 0), variavel === 'umidade' ? 1 : 0) || 1;

  return (
    <section className="cartao grafico-clima" aria-labelledby={`${idDescricao}-titulo`}>
      <div className="alternador" role="group" aria-label="Escolha o que mostrar no gráfico">
        {(Object.keys(CONFIG) as Variavel[]).map(v => (
          <button key={v} type="button" className="alternador-opcao" aria-pressed={variavel === v} onClick={() => setVariavel(v)}>
            {CONFIG[v].titulo}
          </button>
        ))}
      </div>

      <div>
        <h2 id={`${idDescricao}-titulo`} className="titulo-secao">
          {cfg.titulo} <span className="unidade">({cfg.unidade})</span>
        </h2>
        <p id={idDescricao} className="texto-apoio">{cfg.explicacao}</p>
      </div>

      <div className="rolagem-horizontal">
        <div className="barras" role="img" aria-describedby={idDescricao} aria-label={`Gráfico de ${cfg.titulo.toLowerCase()} por mês. A mesma informação está na tabela abaixo.`}>
          {valores.map(({ mes, valor }) => (
            <div key={mes} className="barra-coluna">
              <span className="barra-valor">{valor === null ? '—' : formatarNumero(valor)}</span>
              <span
                className={`barra barra-${variavel}`}
                style={{ height: valor === null ? 0 : `${Math.max(4, (valor / maximo) * 100)}%` }}
              />
              <span className={`barra-marca ${mesesDestacados.has(mes) ? 'barra-marca-ativa' : ''}`} />
              <span className="barra-rotulo">{NOME_MES_CURTO[mes - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {mesesDestacados.size > 0 && (
        <p className="legenda-linha">
          <span className="amostra-marca" aria-hidden="true" /> Listrado embaixo: {rotuloDestaque}
        </p>
      )}

      <details className="detalhes">
        <summary>Ver os valores em tabela</summary>
        <table className="tabela">
          <caption className="visualmente-oculto">{cfg.titulo} por mês</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">{cfg.titulo}</th>
              <th scope="col">{rotuloDestaque}</th>
            </tr>
          </thead>
          <tbody>
            {valores.map(({ mes, valor }) => (
              <tr key={mes}>
                <th scope="row">{NOME_MES[mes - 1]}</th>
                <td>{valor === null ? 'sem dado' : cfg.formatar(valor)}</td>
                <td>{mesesDestacados.has(mes) ? 'sim' : 'não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
