import { Foto } from '../../components/Foto';
import { Icone } from '../../components/Icone';
import { IMAGENS } from '../../components/imagens';
import { Termo } from '../../components/Termo';

export function TelaInicio({ aoComecar }: { aoComecar: () => void }) {
  return (
    <>
      <Foto imagem={IMAGENS.orbita} classe="foto-destaque" legenda="Talhões no Brasil vistos da Estação Espacial Internacional." />
      <p className="sobretitulo">Rotação de culturas</p>
      <h1 tabIndex={-1}>Vai reformar o canavial? Veja o que dá para fazer com a terra até replantar.</h1>
      <p className="texto-grande">
        Entre o último corte e o plantio novo, a área pode ficar parada, dar uma safra de amendoim ou receber um adubo verde. Cada escolha muda o quanto a terra sofre com a chuva e chega forte para os próximos cortes.
      </p>
      <ul className="lista-pontos">
        <li><Icone nome="dados" /> Mostra como costuma chover no seu local, com base em mais de 30 anos de dados da NASA.</li>
        <li><Icone nome="alvo" /> Compara o que você já faz com pelo menos dois outros caminhos.</li>
        <li><Icone nome="pessoa" /> Diz o que ainda falta saber e o que vale perguntar ao agrônomo.</li>
      </ul>
      <p className="texto-apoio">
        Leva uns 5 minutos. Dá para voltar e mudar qualquer resposta. Não sabe o que é <Termo id="reforma">reforma</Termo>? Toque no "?".
      </p>
      <button type="button" className="botao botao-primario botao-largo" onClick={aoComecar}>
        Começar <Icone nome="seguir" />
      </button>
    </>
  );
}
