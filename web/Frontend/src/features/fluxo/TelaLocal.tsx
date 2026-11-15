import { useEffect, useId, useState } from 'react';
import { buscarMunicipios } from '../../api/cliente';
import type { Local } from '../../api/tipos';
import { Icone } from '../../components/Icone';
import { DicaPermissao } from '../../components/DicaPermissao';
import { type DadosFluxo, descreverLocal, formatarCoordenada, parseCoordenada } from './estadoFluxo';
import type { SituacaoGps } from './useLocalizacao';

interface TelaLocalProps {
  dados: DadosFluxo;
  situacaoGps: SituacaoGps;
  mostrarDica: boolean;
  aoConfirmar: () => void;
  aoEscolherMunicipio: (local: Local) => void;
  aoTrocarParaBusca: () => void;
  aoTentarGps: () => void;
  aoVoltar: () => void;
}

export function TelaLocal(props: TelaLocalProps) {
  const { dados } = props;
  if (dados.modoLocal === 'confirmar' && dados.local) {
    return (
      <>
        <div className="local-confirmar">
          <span className="local-alfinete" aria-hidden="true"><Icone nome="local" tamanho={56} /></span>
          <h1 tabIndex={-1}>
            Você está perto de <span className="local-nome">{descreverLocal(dados.local)}</span>
          </h1>
          <p className="texto-grande">É aqui que fica a plantação?</p>
          {dados.origem_local === 'gps' && (
            <p className="texto-apoio local-coordenada">
              Seu ponto: <span className="numero">{formatarCoordenada(dados.local.latitude, dados.local.longitude)}</span>
            </p>
          )}
        </div>
        <div className="respostas-grandes">
          <button type="button" className="botao botao-primario botao-gigante" onClick={props.aoConfirmar}>
            <Icone nome="ok" tamanho={28} /> Sim, é aqui
          </button>
          <button type="button" className="botao botao-secundario botao-gigante" onClick={props.aoTrocarParaBusca}>
            Não, é em outro lugar
          </button>
        </div>
        <div className="navegacao navegacao-unica">
          <button type="button" className="botao botao-secundario" onClick={props.aoVoltar}>
            <Icone nome="voltar" /> Voltar
          </button>
        </div>
      </>
    );
  }
  return <BuscaMunicipio {...props} />;
}

function BuscaMunicipio({ dados, situacaoGps, mostrarDica, aoEscolherMunicipio, aoTentarGps, aoVoltar }: TelaLocalProps) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<Local[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const coordenadaDigitada = parseCoordenada(texto);

  // Busca enquanto digita, com uma pausa curta para não chamar a API a cada letra.
  useEffect(() => {
    let ativo = true;
    if (texto.trim().length < 2 || parseCoordenada(texto)) {
      setResultados([]);
      setBuscou(false);
      return;
    }
    const espera = setTimeout(() => {
      buscarMunicipios(texto)
        .then(lista => {
          if (!ativo) return;
          setResultados(lista);
          setBuscou(true);
          setFalhou(false);
        })
        .catch(() => ativo && setFalhou(true));
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [texto]);

  return (
    <>
      <h1 tabIndex={-1}>Em qual cidade fica a plantação?</h1>
      {dados.motivoBusca && (
        <p className="caixa-porque">
          <Icone nome="info" tamanho={20} />
          <span>{dados.motivoBusca}</span>
        </p>
      )}

      <div className="campo">
        <label htmlFor={`${id}-busca`}>Nome da cidade</label>
        <input
          id={`${id}-busca`}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Comece a escrever, ex.: Olímpia"
          value={texto}
          aria-describedby={`${id}-ajuda`}
          aria-controls={`${id}-lista`}
          onChange={e => setTexto(e.target.value)}
        />
        <span id={`${id}-ajuda`} className="texto-apoio">
          Não precisa de acento. Toque na cidade quando ela aparecer, ou digite uma coordenada (ex.: 35.47, -97.52).
        </span>
      </div>

      {coordenadaDigitada && (
        <ul className="lista-municipios" aria-label="Coordenada digitada">
          <li>
            <button
              type="button"
              className="municipio-opcao"
              onClick={() =>
                aoEscolherMunicipio({
                  codigo_ibge: '',
                  municipio: formatarCoordenada(coordenadaDigitada.latitude, coordenadaDigitada.longitude),
                  uf: '',
                  latitude: coordenadaDigitada.latitude,
                  longitude: coordenadaDigitada.longitude
                })
              }
            >
              <Icone nome="local" tamanho={22} />
              <span className="municipio-nome">Usar o ponto {formatarCoordenada(coordenadaDigitada.latitude, coordenadaDigitada.longitude)}</span>
            </button>
          </li>
        </ul>
      )}

      <div aria-live="polite">
        {falhou && <p className="mensagem-erro"><Icone nome="alerta" tamanho={20} /> Não deu para buscar agora. Veja a internet e tente de novo.</p>}
        {buscou && !falhou && resultados.length === 0 && (
          <p className="texto-apoio">Não achamos "{texto.trim()}". Confira se o nome está escrito certo.</p>
        )}
      </div>
      {resultados.length > 0 && (
        <ul id={`${id}-lista`} className="lista-municipios" aria-label="Cidades encontradas">
          {resultados.map(m => (
            <li key={m.codigo_ibge}>
              <button type="button" className="municipio-opcao" onClick={() => aoEscolherMunicipio(m)}>
                <Icone nome="local" tamanho={22} />
                <span className="municipio-nome">{m.municipio}</span>
                <span className="municipio-uf">{m.uf}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {mostrarDica && <DicaPermissao />}
      <div className="acoes-discretas">
        <button type="button" className="link-discreto" onClick={aoTentarGps} disabled={situacaoGps !== 'parado'}>
          <Icone nome="local" tamanho={18} /> {situacaoGps === 'parado' ? 'Usar onde estou agora' : 'Procurando…'}
        </button>
      </div>
      <div className="navegacao navegacao-unica">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
      </div>
    </>
  );
}
