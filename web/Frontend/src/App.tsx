import { useCallback, useEffect, useRef, useState } from 'react';
import { criarAnalise, FalhaApi, SINALIZAR_MOCK } from './api/cliente';
import type { CorrecoesTalhao, Local, RequisitoId, Resposta } from './api/tipos';
import { roteiroDaTela } from './accessibility/roteiros';
import { useNarracao } from './accessibility/useNarracao';
import { Cabecalho } from './components/Cabecalho';
import { EstadoCarregando, EstadoFalha } from './components/Estados';
import { ResumoImpressao } from './components/ResumoImpressao';
import {
  DADOS_INICIAIS, descreverLocal, PERGUNTAS, TITULO_ETAPA, VOLTAR_PARA,
  type DadosFluxo, type Etapa, type SituacaoAnalise
} from './features/fluxo/estadoFluxo';
import { TelaClima } from './features/fluxo/TelaClima';
import { TelaComparar } from './features/fluxo/TelaComparar';
import { TelaCultura } from './features/fluxo/TelaCultura';
import { TelaEstrategia } from './features/fluxo/TelaEstrategia';
import { TelaEstrategias } from './features/fluxo/TelaEstrategias';
import { TelaInicio } from './features/fluxo/TelaInicio';
import { TelaLocal } from './features/fluxo/TelaLocal';
import { TelaPrioridades } from './features/fluxo/TelaPrioridades';
import { TelaProblemas } from './features/fluxo/TelaProblemas';
import { TelaProximos } from './features/fluxo/TelaProximos';
import { TelaRecurso } from './features/fluxo/TelaRecurso';
import { useLocalizacao } from './features/fluxo/useLocalizacao';

/** Pausa curta depois de um toque, para a pessoa ver o ✓ antes de trocar de tela. */
const PAUSA_TOQUE_MS = 250;

const ehRecurso = (e: Etapa): e is RequisitoId => e === 'maquinas_graos' || e === 'comprador_graos' || e === 'irrigacao';

export function App() {
  const [etapa, setEtapa] = useState<Etapa>('inicio');
  const [dados, setDados] = useState<DadosFluxo>(DADOS_INICIAIS);
  const [analise, setAnalise] = useState<SituacaoAnalise>({ situacao: 'ociosa' });
  const narracao = useNarracao();
  const principal = useRef<HTMLElement>(null);
  const primeiraRenderizacao = useRef(true);
  const temporizador = useRef<number>();

  const mudar = useCallback((parcial: Partial<DadosFluxo>) => setDados(d => ({ ...d, ...parcial })), []);

  const ir = useCallback(
    (proxima: Etapa) => {
      window.clearTimeout(temporizador.current);
      narracao.parar();
      setEtapa(proxima);
    },
    [narracao]
  );
  const irDepoisDoToque = useCallback(
    (proxima: Etapa) => {
      window.clearTimeout(temporizador.current);
      temporizador.current = window.setTimeout(() => ir(proxima), PAUSA_TOQUE_MS);
    },
    [ir]
  );

  // A cada troca de tela: volta ao topo e leva o foco ao título, para teclado e leitor de tela.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    window.scrollTo(0, 0);
    principal.current?.querySelector<HTMLElement>('h1')?.focus();
  }, [etapa]);

  const gps = useLocalizacao({
    aoAchar: useCallback(
      (local: Local) => {
        mudar({ local, origem_local: 'gps', modoLocal: 'confirmar', motivoBusca: null });
        ir('local');
      },
      [mudar, ir]
    ),
    aoFalhar: useCallback(
      (motivo: string) => {
        mudar({ modoLocal: 'buscar', motivoBusca: motivo });
        ir('local');
      },
      [mudar, ir]
    )
  });

  const pedirAnalise = useCallback(
    async (correcoes: CorrecoesTalhao = dados.correcoes) => {
      if (!dados.cultura_atual_id || !dados.local || !dados.origem_local) return;
      setAnalise({ situacao: 'carregando' });
      const r = dados.recursos_disponiveis;
      try {
        const resultado = await criarAnalise(
          {
            latitude: dados.local.latitude,
            longitude: dados.local.longitude,
            origem_local: dados.origem_local,
            codigo_ibge: dados.local.codigo_ibge,
            cultura_atual_id: dados.cultura_atual_id,
            problemas: dados.problemas,
            recursos_disponiveis: {
              maquinas_graos: r.maquinas_graos ?? 'nao_sei',
              comprador_graos: r.comprador_graos ?? 'nao_sei',
              irrigacao: r.irrigacao ?? 'nao_sei'
            },
            prioridades: dados.prioridades,
            correcoes
          },
          descreverLocal(dados.local)
        );
        setAnalise({ situacao: 'sucesso', analise: resultado });
      } catch (e) {
        const falha = e instanceof FalhaApi ? e : new FalhaApi('erro_inesperado', 'Algo deu errado.');
        setAnalise({ situacao: 'falha', codigo: falha.codigo, mensagem: falha.message });
      }
    },
    [dados]
  );

  const corrigirTalhao = (parcial: CorrecoesTalhao) => {
    const correcoes = { ...dados.correcoes, ...parcial };
    mudar({ correcoes });
    void pedirAnalise(correcoes);
  };

  const analisePronta = analise.situacao === 'sucesso' ? analise.analise : null;
  const estrategia = analisePronta?.estrategias.find(e => e.estrategia_id === dados.estrategia_id) ?? analisePronta?.estrategias[0] ?? null;
  const voltar = () => ir(VOLTAR_PARA[etapa]);
  const proximaPergunta = (atual: Etapa): Etapa => PERGUNTAS[PERGUNTAS.indexOf(atual) + 1] ?? 'estrategias';
  const abrirEstrategia = (id: string) => {
    mudar({ estrategia_id: id });
    ir('estrategia');
  };
  const irParaBusca = () => {
    mudar({ modoLocal: 'buscar', motivoBusca: null });
    ir('local');
  };

  function conteudo() {
    if (ehRecurso(etapa)) {
      return (
        <TelaRecurso
          key={etapa}
          recurso={etapa}
          resposta={dados.recursos_disponiveis[etapa]}
          aoResponder={(resp: Resposta) => {
            mudar({ recursos_disponiveis: { ...dados.recursos_disponiveis, [etapa]: resp } });
            irDepoisDoToque(proximaPergunta(etapa));
          }}
          aoVoltar={voltar}
        />
      );
    }
    switch (etapa) {
      case 'inicio':
        return (
          <TelaInicio
            situacaoGps={gps.situacao}
            mostrarDica={gps.mostrarDica}
            aoUsarLocalizacao={() => void gps.pedir()}
            aoDigitarCidade={irParaBusca}
          />
        );
      case 'local':
        return (
          <TelaLocal
            dados={dados}
            situacaoGps={gps.situacao}
            mostrarDica={gps.mostrarDica}
            aoConfirmar={() => ir('cultura')}
            aoEscolherMunicipio={local => {
              mudar({ local, origem_local: 'municipio', motivoBusca: null });
              ir('cultura');
            }}
            aoTrocarParaBusca={irParaBusca}
            aoTentarGps={() => void gps.pedir()}
            aoVoltar={voltar}
          />
        );
      case 'cultura':
        return (
          <TelaCultura
            dados={dados}
            aoEscolher={c => {
              mudar({ cultura_atual_id: c.cultura_id, nomeCultura: c.nome });
              irDepoisDoToque(proximaPergunta('cultura'));
            }}
            aoVoltar={voltar}
          />
        );
      case 'problemas':
        return <TelaProblemas dados={dados} aoMudar={mudar} aoVoltar={voltar} aoAvancar={() => ir('prioridades')} />;
      case 'prioridades':
        return (
          <TelaPrioridades
            dados={dados}
            aoMudar={mudar}
            aoVoltar={voltar}
            aoAvancar={() => {
              void pedirAnalise();
              ir('estrategias');
            }}
          />
        );
    }

    // Telas que dependem da análise: tratam carregando, falha e dados insuficientes.
    if (analise.situacao === 'carregando' || analise.situacao === 'ociosa') {
      return (
        <>
          <h1 tabIndex={-1}>Montando os caminhos</h1>
          <EstadoCarregando mensagem="Olhando a chuva dos últimos 30 anos e a terra daí…" />
        </>
      );
    }
    if (analise.situacao === 'falha') {
      const insuficiente = analise.codigo === 'dados_insuficientes';
      return (
        <>
          <h1 tabIndex={-1}>{insuficiente ? 'Faltam dados para esse lugar' : 'Não deu para montar os caminhos'}</h1>
          <EstadoFalha
            titulo={insuficiente ? 'Sem dados suficientes' : 'Deu um problema'}
            mensagem={insuficiente ? `${analise.mensagem} Tente uma cidade vizinha.` : analise.mensagem}
            acaoRotulo={insuficiente ? 'Escolher outra cidade' : 'Tentar de novo'}
            aoAgir={insuficiente ? irParaBusca : () => void pedirAnalise()}
          />
        </>
      );
    }

    const a = analise.analise;
    switch (etapa) {
      case 'estrategias':
        return (
          <TelaEstrategias
            analise={a}
            prioridades={dados.prioridades}
            aoAbrir={abrirEstrategia}
            aoCorrigir={corrigirTalhao}
            aoVoltar={voltar}
            aoComparar={() => ir('comparar')}
          />
        );
      case 'comparar':
        return <TelaComparar analise={a} aoAbrir={abrirEstrategia} aoVoltar={voltar} aoAvancar={() => ir('proximos')} />;
      case 'estrategia':
        return (
          estrategia && (
            <TelaEstrategia
              estrategia={estrategia}
              ehMock={a.eh_mock}
              recursos={dados.recursos_disponiveis}
              aoVoltar={voltar}
              aoAvancar={() => ir('clima')}
            />
          )
        );
      case 'clima':
        return estrategia && <TelaClima analise={a} estrategia={estrategia} aoVoltar={voltar} aoAvancar={() => ir('proximos')} />;
      case 'proximos':
        return (
          <TelaProximos
            dados={dados}
            analise={a}
            aoVoltar={voltar}
            aoRecomecar={() => {
              setDados(DADOS_INICIAIS);
              setAnalise({ situacao: 'ociosa' });
              ir('inicio');
            }}
          />
        );
    }
  }

  const indicePergunta = PERGUNTAS.indexOf(etapa);

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>
      <Cabecalho
        progresso={indicePergunta >= 0 ? { atual: indicePergunta + 1, total: PERGUNTAS.length } : null}
        tituloPasso={TITULO_ETAPA[etapa]}
        narracao={{
          suportado: narracao.suportado,
          falando: narracao.falando,
          aoOuvir: () => narracao.falar(roteiroDaTela(etapa, dados, analisePronta, estrategia)),
          aoParar: narracao.parar
        }}
      />
      <main id="conteudo" ref={principal} className="conteudo principal">
        {conteudo()}
      </main>
      {analisePronta && <ResumoImpressao dados={dados} analise={analisePronta} />}
      <footer className="rodape">
        <div className="conteudo">
          <p>
            Feito pela equipe FATESA no NASA Space Apps Challenge 2026. Ajuda a pensar, mas não substitui o agrônomo.
          </p>
          <p>
            {SINALIZAR_MOCK ? 'Dados de exemplo (inventados). ' : 'Clima: NASA POWER. '}
            <a href={`${import.meta.env.BASE_URL}imagens/CREDITOS.md`}>Créditos das fotos</a>
          </p>
        </div>
      </footer>
    </>
  );
}
