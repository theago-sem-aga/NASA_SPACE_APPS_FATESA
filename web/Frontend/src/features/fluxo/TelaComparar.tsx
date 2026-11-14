import type { Analise, AtributosEstrategia } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { Icone } from '../../components/Icone';
import { Medidor } from '../../components/Medidor';
import { Pictograma, PICTOGRAMA_CULTURA } from '../../components/Pictograma';
import { PICTO_ATRIBUTO, ROTULO_ATRIBUTO, ROTULO_CONFIANCA } from './rotulos';

interface TelaCompararProps {
  analise: Analise;
  aoAbrir: (estrategiaId: string) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

const ATRIBUTOS = Object.keys(ROTULO_ATRIBUTO) as (keyof AtributosEstrategia)[];

export function TelaComparar({ analise, aoAbrir, aoVoltar, aoAvancar }: TelaCompararProps) {
  const estrategias = analise.estrategias;
  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>Lado a lado</h1>
      <p className="legenda-medidor">
        <span><span className="amostra-medidor amostra-bom" aria-hidden="true" /> Verde: bom para você</span>
        <span><span className="amostra-medidor amostra-atencao" aria-hidden="true" /> Laranja: pesa contra</span>
      </p>

      <p className="dica-rolagem texto-apoio">Deslize a tabela para o lado para ver os outros caminhos.</p>
      <div className="rolagem-horizontal cartao tabela-comparacao-moldura">
        <table className="tabela tabela-comparacao">
          <caption className="visualmente-oculto">Comparação entre os caminhos</caption>
          <thead>
            <tr>
              <th scope="col"><span className="visualmente-oculto">Critério</span></th>
              {estrategias.map(e => {
                const intermediaria = e.etapas_rotacao[1];
                return (
                  <th key={e.estrategia_id} scope="col">
                    {intermediaria && <Pictograma nome={PICTOGRAMA_CULTURA[intermediaria.cultura_id] ?? 'nao_sei'} tamanho={44} />}
                    {e.eh_pratica_atual && <span className="etiqueta etiqueta-neutra">Hoje</span>}
                    <span className="comparacao-nome">{e.nome}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ATRIBUTOS.map(a => (
              <tr key={a}>
                <th scope="row">
                  <span className="comparacao-criterio">
                    <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={32} />
                    {ROTULO_ATRIBUTO[a].nome}
                  </span>
                </th>
                {estrategias.map(e => (
                  <td key={e.estrategia_id}>
                    <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span className="comparacao-criterio">
                  <Pictograma nome="terra_descoberta" tamanho={32} />
                  Meses de terra descoberta
                </span>
              </th>
              {estrategias.map(e => (
                <td key={e.estrategia_id} className="comparacao-numero">{e.calendario.filter(m => m.cobertura === 'solo_descoberto').length}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                <span className="comparacao-criterio">
                  <Pictograma nome="nao_sei" tamanho={32} />
                  Quanto confiar
                </span>
              </th>
              {estrategias.map(e => <td key={e.estrategia_id}>{ROTULO_CONFIANCA[e.confianca]}</td>)}
            </tr>
            <tr>
              <th scope="row"><span className="visualmente-oculto">Abrir</span></th>
              {estrategias.map(e => (
                <td key={e.estrategia_id}>
                  <button type="button" className="botao-link" onClick={() => aoAbrir(e.estrategia_id)}>
                    Ver tudo <span className="visualmente-oculto">sobre {e.nome}</span> <Icone nome="seguir" tamanho={18} />
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        <button type="button" className="botao botao-primario" onClick={aoAvancar}>
          Ver meu resumo <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
