import { useCallback, useEffect, useRef, useState } from 'react';
import { criarAnalise, FalhaApi, SINALIZAR_MOCK } from './api/cliente';
import { roteiroDaTela } from './accessibility/roteiros';
import { useNarracao } from './accessibility/useNarracao';
import { Cabecalho } from './components/Cabecalho';
import { EstadoCarregando, EstadoFalha } from './components/Estados';
import { ResumoImpressao } from './components/ResumoImpressao';
import {
  DADOS_INICIAIS, ETAPAS, TITULO_ETAPA, VOLTAR_PARA, type DadosFluxo, type Etapa, type SituacaoAnalise
} from './features/fluxo/estadoFluxo';
import { TelaClima } from './features/fluxo/TelaClima';
import { TelaComparar } from './features/fluxo/TelaComparar';
import { TelaCultura } from './features/fluxo/TelaCultura';
import { TelaEstrategia } from './features/fluxo/TelaEstrategia';
import { TelaEstrategias } from './features/fluxo/TelaEstrategias';
import { TelaInicio } from './features/fluxo/TelaInicio';
import { TelaLocal } from './features/fluxo/TelaLocal';
import { TelaPrioridades } from './features/fluxo/TelaPrioridades';
import { TelaProximos } from './features/fluxo/TelaProximos';
import { TelaTalhao } from './features/fluxo/TelaTalhao';

const TOTAL_PASSOS = ETAPAS.length - 1;

export function App() {
  const [etapa, setEtapa] = useState<Etapa>('inicio');
  const [dados, setDados] = useState<DadosFluxo>(DADOS_INICIAIS);
  const [analise, setAnalise] = useState<SituacaoAnalise>({ situacao: 'ociosa' });
  const narracao = useNarracao();
  const principal = useRef<HTMLElement>(null);
  const primeiraRenderizacao = useRef(true);

  const mudar = useCallback((parcial: Partial<DadosFluxo>) => setDados(d => ({ ...d, ...parcial })), []);

  const ir = useCallback(
    (proxima: Etapa) => {
      narracao.parar();
      setEtapa(proxima);
    },
    [narracao]
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

  const pedirAnalise = useCallback(async () => {
    if (!dados.cultura_atual_id) return;
    setAnalise({ situacao: 'carregando' });
    try {
      const resultado = await criarAnalise({
        descricao_local: dados.descricao_local.trim(),
        latitude: dados.latitude,
        longitude: dados.longitude,
        cultura_atual_id: dados.cultura_atual_id,
        textura_solo: dados.textura_solo ?? 'nao_sei',
        relevo: dados.relevo ?? 'nao_sei',
        problemas: dados.problemas,
        recursos_disponiveis: dados.recursos_disponiveis,
        prioridades: dados.prioridades
      });
      setAnalise({ situacao: 'sucesso', analise: resultado });
    } catch (e) {
      const falha = e instanceof FalhaApi ? e : new FalhaApi('erro_inesperado', 'Algo deu errado.');
      setAnalise({ situacao: 'falha', codigo: falha.codigo, mensagem: falha.message });
    }
  }, [dados]);

  const analisePronta = analise.situacao === 'sucesso' ? analise.analise : null;
  const estrategia = analisePronta?.estrategias.find(e => e.estrategia_id === dados.estrategia_id) ?? analisePronta?.estrategias[0] ?? null;
  const indice = ETAPAS.indexOf(etapa);
  const voltar = () => ir(VOLTAR_PARA[etapa]);
  const avancar = () => ir(ETAPAS[Math.min(indice + 1, ETAPAS.length - 1)]);
  const abrirEstrategia = (id: string) => {
    mudar({ estrategia_id: id });
    ir('estrategia');
  };

  function conteudo() {
    switch (etapa) {
      case 'inicio':
        return <TelaInicio aoComecar={avancar} />;
      case 'local':
        return <TelaLocal dados={dados} aoMudar={mudar} aoVoltar={voltar} aoAvancar={avancar} />;
      case 'cultura':
        return <TelaCultura dados={dados} aoMudar={mudar} aoVoltar={voltar} aoAvancar={avancar} />;
      case 'talhao':
        return <TelaTalhao dados={dados} aoMudar={mudar} aoVoltar={voltar} aoAvancar={avancar} />;
      case 'prioridades':
        return (
          <TelaPrioridades
            dados={dados}
            aoMudar={mudar}
            aoVoltar={voltar}
            aoAvancar={() => {
              void pedirAnalise();
              avancar();
            }}
          />
        );
    }

    // Telas que dependem da análise: tratam carregando, falha e dados insuficientes.
    if (analise.situacao === 'carregando' || analise.situacao === 'ociosa') {
      return (
        <>
          <h1 tabIndex={-1}>Montando os caminhos</h1>
          <EstadoCarregando mensagem="Buscando o histórico de chuva do local e comparando as opções…" />
        </>
      );
    }
    if (analise.situacao === 'falha') {
      const insuficiente = analise.codigo === 'dados_insuficientes';
      return (
        <>
          <h1 tabIndex={-1}>{insuficiente ? 'Faltam dados para esse local' : 'Não deu para montar os caminhos'}</h1>
          <EstadoFalha
            titulo={insuficiente ? 'Dados insuficientes' : 'Erro'}
            mensagem={insuficiente ? `${analise.mensagem} Tente um ponto próximo ou volte mais tarde.` : analise.mensagem}
            acaoRotulo={insuficiente ? 'Mudar o local' : 'Tentar de novo'}
            aoAgir={insuficiente ? () => ir('local') : () => void pedirAnalise()}
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
              aoAvancar={avancar}
            />
          )
        );
      case 'clima':
        return estrategia && <TelaClima analise={a} estrategia={estrategia} aoVoltar={voltar} aoAvancar={avancar} />;
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

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>
      <Cabecalho
        passoAtual={indice}
        totalPassos={TOTAL_PASSOS}
        tituloPasso={TITULO_ETAPA[etapa]}
        narracao={{
          suportado: narracao.suportado,
          falando: narracao.falando,
          aoOuvir: () => narracao.falar(roteiroDaTela(etapa, analisePronta, estrategia)),
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
