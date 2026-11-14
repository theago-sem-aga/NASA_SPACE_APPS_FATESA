// Roteiros falados por tela: texto escrito para ser ouvido, em vez de ler o HTML inteiro (convenção §9).
import { SINALIZAR_MOCK } from '../api/cliente';
import type { Analise, Estrategia } from '../api/tipos';
import type { Etapa } from '../features/fluxo/estadoFluxo';
import { ROTULO_CONFIANCA, ROTULO_PRIORIDADE } from '../features/fluxo/rotulos';

export function roteiroDaTela(etapa: Etapa, analise: Analise | null, estrategia: Estrategia | null): string {
  const aviso = analise?.eh_mock && SINALIZAR_MOCK ? 'Lembrete: isto é um exemplo de teste, com números inventados. ' : '';
  switch (etapa) {
    case 'inicio':
      return 'Vai reformar o canavial? Aqui você vê o que dá para fazer com a terra até replantar: deixar parada, plantar amendoim ou plantar um adubo verde. Toque em Começar.';
    case 'local':
      return 'Onde fica o talhão? Se você estiver na área, toque em usar o GPS. Se não, escreva o município e o estado.';
    case 'cultura':
      return 'O que está plantado nesse talhão hoje? Escolha na lista e toque em Continuar. Por enquanto, só a cana tem exemplo pronto.';
    case 'talhao':
      return 'Conte um pouco sobre o talhão: como é a terra, se o terreno é inclinado, o que está incomodando e se você tem máquina, comprador e irrigação. Nenhuma pergunta é obrigatória.';
    case 'prioridades':
      return `Nesta reforma, o que pesa mais para você? Escolha duas: ${Object.values(ROTULO_PRIORIDADE).map(p => p.nome).join(', ')}.`;
    case 'estrategias':
      return analise
        ? `${aviso}São ${analise.estrategias.length} caminhos: ${analise.estrategias.map(e => e.nome).join('; ')}. Toque em um para ver os detalhes, ou compare lado a lado.`
        : 'Montando os caminhos.';
    case 'comparar':
      return `${aviso}Comparação lado a lado. Em precisa de água e em trabalho e custo, menos é melhor. Nos outros critérios, mais é melhor.`;
    case 'estrategia':
      return estrategia
        ? `${aviso}${estrategia.nome}. ${estrategia.resumo} ${ROTULO_CONFIANCA[estrategia.confianca]}. Por que apareceu: ${estrategia.motivos.join(' ')} O que pode ganhar: ${estrategia.beneficios.join(' ')} O que pode dar errado: ${estrategia.riscos.join(' ')} O que ainda não sabemos: ${estrategia.lacunas.join(' ')} Pergunta para o agrônomo: ${estrategia.pergunta_especialista}`
        : '';
    case 'clima':
      return `${aviso}Como costuma chover aí, mês a mês. A faixa listrada embaixo do mês mostra quando a terra fica descoberta. Os números também estão numa tabela, no fim da tela.`;
    case 'proximos':
      return 'Este é o seu resumo, com o talhão e os caminhos lado a lado. Antes de bater o martelo, três coisas. Um: converse com o agrônomo da usina, da cooperativa ou da Casa da Agricultura. Dois: faça a análise de solo antes da reforma. Três: confira a janela de plantio no Zoneamento Agrícola, pelo app Plantio Certo. Dá para imprimir um resumo para levar.';
  }
}
