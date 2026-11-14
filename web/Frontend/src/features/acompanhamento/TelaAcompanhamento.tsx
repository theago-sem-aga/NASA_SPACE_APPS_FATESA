import { useCallback, useEffect, useState } from 'react';
import { buscarAcompanhamento, buscarPrevisao, FalhaApi } from '../../api/cliente';
import type { Acompanhamento, CoberturaSolo, EstadoArea, Estrategia, FotoSatelite, Local, Nivel, OrigemLocal, PrevisaoClima } from '../../api/tipos';
import { EstadoCarregando, EstadoFalha } from '../../components/Estados';
import { Icone } from '../../components/Icone';
import { Medidor } from '../../components/Medidor';
import { Pictograma, PICTOGRAMA_CULTURA, type NomePictograma } from '../../components/Pictograma';
import { formatarCoordenada } from '../fluxo/estadoFluxo';
import { SecaoPrevisao } from '../producao/TelaProducao';
import { NOME_MES, ROTULO_COBERTURA } from '../fluxo/rotulos';
import { dataPorExtenso, FRASE_ESTADO } from './frases';
import { roteiroAcompanhamento } from './roteiroAcompanhamento';

interface TelaAcompanhamentoProps {
  local: Local;
  /** 'gps' = o ponto exato do celular; as fotos são desse ponto. */
  origem: OrigemLocal | null;
  /** Caminho escolhido: o calendário dele diz como a terra deveria estar agora. */
  estrategia: Estrategia | null;
  aoMudarRoteiro: (texto: string) => void;
  aoVoltar: () => void;
  /** Some quando a tela foi aberta pelo próprio resumo. */
  aoVerResumo?: () => void;
}

type Situacao =
  | { situacao: 'carregando' }
  | { situacao: 'sucesso'; dados: Acompanhamento }
  | { situacao: 'falha'; codigo: string; mensagem: string };

// ---------- textos e figuras (o front só traduz o que a API mandou) ----------

const FIGURA_ESTADO: Record<EstadoArea, NomePictograma> = {
  terra_descoberta: 'terra_descoberta',
  pouca_planta: 'solo_cansado',
  planta_verde: 'pastagem'
};
const VERDOR: Record<EstadoArea, Nivel> = { terra_descoberta: 'nenhum', pouca_planta: 'baixo', planta_verde: 'alto' };
const FIGURA_COBERTURA: Record<CoberturaSolo, NomePictograma> = {
  solo_descoberto: 'terra_descoberta',
  cultura_intermediaria: 'amendoim',
  adubo_verde: 'crotalaria',
  palhada: 'palhada',
  cultura_principal: 'cana'
};

/** Na lavoura do meio da rotação, a figura é a da cultura escolhida (soja, milheto...). */
function figuraDoPlano(plano: CoberturaSolo, estrategia: Estrategia | null): NomePictograma {
  const meio = estrategia?.etapas_rotacao[1]?.cultura_id;
  if ((plano === 'cultura_intermediaria' || plano === 'adubo_verde') && meio && PICTOGRAMA_CULTURA[meio]) return PICTOGRAMA_CULTURA[meio];
  return FIGURA_COBERTURA[plano];
}

/** O plano do mês atual, lido do calendário do caminho escolhido (não é regra: é o dado da estratégia). */
export function planoDoMes(estrategia: Estrategia | null, mes: number): CoberturaSolo | null {
  return estrategia?.calendario.find(m => m.mes === mes)?.cobertura ?? null;
}

// ---------- peças ----------

function CartaoFoto({ foto, destaque }: { foto: FotoSatelite; destaque: boolean }) {
  return (
    <figure className={`satelite-foto ${destaque ? 'satelite-foto-grande' : ''}`}>
      <img src={/^https?:/.test(foto.imagem) ? foto.imagem : `${import.meta.env.BASE_URL}${foto.imagem}`} alt={`Foto do satélite da área em ${dataPorExtenso(foto.data)}: ${FRASE_ESTADO[foto.estado].toLowerCase()}.`} loading="lazy" />
      <figcaption>
        <strong>{destaque ? dataPorExtenso(foto.data) : foto.data.split('-').reverse().slice(0, 2).join('/')}</strong>
        <span className={`satelite-estado satelite-${foto.estado}`}>{FRASE_ESTADO[foto.estado]}</span>
      </figcaption>
    </figure>
  );
}

// ---------- tela ----------

export function TelaAcompanhamento({ local, origem, estrategia, aoMudarRoteiro, aoVoltar, aoVerResumo }: TelaAcompanhamentoProps) {
  const [estado, setEstado] = useState<Situacao>({ situacao: 'carregando' });
  /** Chuva prevista dos próximos meses (da região da cidade). null = não temos para essa região. */
  const [previsao, setPrevisao] = useState<PrevisaoClima | null>(null);

  const carregar = useCallback(async () => {
    setEstado({ situacao: 'carregando' });
    try {
      setEstado({ situacao: 'sucesso', dados: await buscarAcompanhamento(local, origem) });
    } catch (e) {
      const f = e instanceof FalhaApi ? e : new FalhaApi('erro_inesperado', 'Algo deu errado.');
      setEstado({ situacao: 'falha', codigo: f.codigo, mensagem: f.message });
    }
  }, [local, origem]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // A previsão é opcional: se a cidade não tiver, a tela segue só com o satélite.
  useEffect(() => {
    let vivo = true;
    buscarPrevisao(local.codigo_ibge)
      .then(p => vivo && setPrevisao(p))
      .catch(() => vivo && setPrevisao(null));
    return () => {
      vivo = false;
    };
  }, [local.codigo_ibge]);

  const mesAtual = new Date().getMonth() + 1;
  const plano = planoDoMes(estrategia, mesAtual);
  const dados = estado.situacao === 'sucesso' ? estado.dados : null;

  useEffect(() => {
    aoMudarRoteiro(dados ? roteiroAcompanhamento(dados, estrategia, plano, mesAtual, local, previsao) : 'Buscando as fotos do satélite.');
  }, [dados, estrategia, plano, mesAtual, local, previsao, aoMudarRoteiro]);

  if (estado.situacao === 'carregando') {
    return (
      <>
        <h1 tabIndex={-1}>Acompanhar a área</h1>
        <EstadoCarregando
          mensagem={
            origem === 'gps'
              ? 'Buscando as fotos do satélite do seu ponto… Na primeira vez pode levar até 1 minuto.'
              : 'Buscando as fotos do satélite…'
          }
        />
      </>
    );
  }
  if (estado.situacao === 'falha') {
    const semDados = estado.codigo === 'dados_insuficientes';
    return (
      <>
        <h1 tabIndex={-1}>Acompanhar a área</h1>
        <EstadoFalha
          titulo={semDados ? 'Sem fotos dessa área' : 'Deu um problema'}
          mensagem={estado.mensagem}
          acaoRotulo={semDados ? 'Voltar' : 'Tentar de novo'}
          aoAgir={semDados ? aoVoltar : () => void carregar()}
        />
      </>
    );
  }

  const d = estado.dados;
  const [ultima, ...anteriores] = d.fotos;
  const confere = plano && ultima ? d.confere_por_cobertura[plano] : null;

  return (
    <>
      <div className="producao-topo">
        <h1 tabIndex={-1}>Acompanhar a área</h1>
        {estrategia && (
          <p className="acompanhamento-caminho">
            <span className="texto-apoio">Seu caminho:</span>
            <span className="etiqueta etiqueta-positiva">{estrategia.etapas_rotacao[1]?.nome ?? estrategia.nome}</span>
          </p>
        )}
        <p className="texto-apoio">
          {d.ponto_exemplo ? `Exemplo: uma área perto de ${local.municipio}` : 'A sua área'} · fotos do satélite
        </p>
        <p className="texto-apoio">
          {d.ponto_exemplo ? 'Ponto do exemplo' : 'Seu ponto'}: <span className="numero">{formatarCoordenada(d.latitude, d.longitude)}</span>
          {!d.ponto_exemplo && origem === 'gps' && ' (o mesmo que o celular pegou no início)'}
        </p>
        {d.ponto_exemplo && origem === 'gps' && (
          <p className="destaque destaque-neutro">
            <Icone nome="info" tamanho={24} />
            Para ver as fotos do seu ponto ({formatarCoordenada(local.latitude, local.longitude)}), o servidor precisa estar ligado.
          </p>
        )}
      </div>

      {!ultima ? (
        <p className="destaque destaque-atencao">
          <Icone nome="alerta" tamanho={24} />
          Nos últimos meses as nuvens cobriram a área em todas as fotos. Tente de novo daqui a uns dias.
        </p>
      ) : (
        <div className="acompanhamento-grade">
          <section className="producao-bloco" aria-labelledby="t-foto">
            <h2 id="t-foto" className="producao-titulo">Última foto</h2>
            <CartaoFoto foto={ultima} destaque />
            <p className="texto-apoio acompanhamento-legenda">
              <span className="acompanhamento-quadrado" aria-hidden="true" /> O quadrado amarelo é a área ({d.lado_talhao_m} m de lado).
            </p>
          </section>

          <section className="producao-bloco" aria-labelledby="t-agora">
            <h2 id="t-agora" className="producao-titulo">Como está agora</h2>

            <div className="producao-cartao">
              <div className="producao-cartao-cab">
                <Pictograma nome={FIGURA_ESTADO[ultima.estado]} tamanho={64} />
                <span>
                  <span className="texto-apoio">O satélite viu</span>
                  <strong className="producao-nome">{FRASE_ESTADO[ultima.estado]}</strong>
                  <Medidor nivel={VERDOR[ultima.estado]} bom />
                </span>
              </div>
            </div>

            {plano && (
              <div className="producao-cartao">
                <div className="producao-cartao-cab">
                  <Pictograma nome={figuraDoPlano(plano, estrategia)} tamanho={64} />
                  <span>
                    <span className="texto-apoio">O plano para {NOME_MES[mesAtual - 1]}</span>
                    <strong className="producao-nome">{ROTULO_COBERTURA[plano].nome}</strong>
                    {estrategia && <span className="texto-apoio">{estrategia.nome}</span>}
                  </span>
                </div>
              </div>
            )}

            {confere === true && (
              <p className="destaque destaque-positivo acompanhamento-veredito">
                <Icone nome="ok" tamanho={32} />
                <span><strong>Está como o plano.</strong> Siga acompanhando.</span>
              </p>
            )}
            {confere === false && (
              <p className="destaque destaque-atencao acompanhamento-veredito">
                <Icone nome="alerta" tamanho={32} />
                <span><strong>Está diferente do plano.</strong> Vá ver a área ou fale com o técnico.</span>
              </p>
            )}
            {!plano && (
              <p className="destaque destaque-neutro">
                <Icone nome="info" tamanho={24} />
                Escolha um caminho para comparar a foto com o plano.
              </p>
            )}
          </section>
        </div>
      )}

      {previsao && <SecaoPrevisao previsao={previsao} />}

      {anteriores.length > 0 && (
        <section className="producao-bloco" aria-labelledby="t-antes">
          <h2 id="t-antes" className="producao-titulo">Fotos de antes</h2>
          <ol className="satelite-linha">
            {anteriores.map(f => (
              <li key={f.data}><CartaoFoto foto={f} destaque={false} /></li>
            ))}
          </ol>
        </section>
      )}

      <p className="texto-apoio producao-fonte">
        Fotos: {d.fonte}. {d.atribuicao}. O satélite passa a cada 5 dias; foto com nuvem em cima da área fica de fora.
      </p>

      <div className={`navegacao ${aoVerResumo ? '' : 'navegacao-unica'}`}>
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        {aoVerResumo && (
          <button type="button" className="botao botao-primario" onClick={aoVerResumo}>
            Ver meu resumo <Icone nome="seguir" />
          </button>
        )}
      </div>
    </>
  );
}
