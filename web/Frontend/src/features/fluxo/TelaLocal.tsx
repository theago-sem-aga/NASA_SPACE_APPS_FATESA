import { useEffect, useId, useState } from 'react';
import { buscarMunicipios } from '../../api/cliente';
import type { Local } from '../../api/tipos';
import { Icone } from '../../components/Icone';
import { DicaPermissao } from '../../components/DicaPermissao';
import { type DadosFluxo, descreverLocal, formatarCoordenada, parseCoordenada } from './estadoFluxo';
import type { SituacaoGps } from './useLocalizacao';
import { tx } from '../../i18n/idioma';

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
            {tx('Você está perto de', 'You are near')} <span className="local-nome">{descreverLocal(dados.local)}</span>
          </h1>
          <p className="texto-grande">{tx('É aqui que fica a plantação?', 'Is this where the field is?')}</p>
          {dados.origem_local === 'gps' && (
            <p className="texto-apoio local-coordenada">
              {tx('Seu ponto:', 'Your point:')} <span className="numero">{formatarCoordenada(dados.local.latitude, dados.local.longitude)}</span>
            </p>
          )}
        </div>
        <div className="respostas-grandes">
          <button type="button" className="botao botao-primario botao-gigante" onClick={props.aoConfirmar}>
            <Icone nome="ok" tamanho={28} /> {tx('Sim, é aqui', 'Yes, it’s here')}
          </button>
          <button type="button" className="botao botao-secundario botao-gigante" onClick={props.aoTrocarParaBusca}>
            {tx('Não, é em outro lugar', 'No, it’s somewhere else')}
          </button>
        </div>
        <div className="navegacao navegacao-unica">
          <button type="button" className="botao botao-secundario" onClick={props.aoVoltar}>
            <Icone nome="voltar" /> {tx('Voltar', 'Back')}
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
      <h1 tabIndex={-1}>{tx('Em qual cidade fica a plantação?', 'Which town is the field in?')}</h1>
      {dados.motivoBusca && (
        <p className="caixa-porque">
          <Icone nome="info" tamanho={20} />
          <span>{dados.motivoBusca}</span>
        </p>
      )}

      <div className="campo">
        <label htmlFor={`${id}-busca`}>{tx('Nome da cidade', 'Town name')}</label>
        <input
          id={`${id}-busca`}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder={tx('Comece a escrever, ex.: Olímpia', 'Start typing, e.g. Fresno')}
          value={texto}
          aria-describedby={`${id}-ajuda`}
          aria-controls={`${id}-lista`}
          onChange={e => setTexto(e.target.value)}
        />
        <span id={`${id}-ajuda`} className="texto-apoio">
          {tx(
            'Busca cidades do Brasil e cidades e condados dos EUA. Não precisa de acento. Toque na cidade quando ela aparecer, ou digite uma coordenada (ex.: 35.47, -97.52).',
            'Search towns and counties in the US or Brazil (e.g. Fresno, Fresno County). Tap the place when it shows up, or type a coordinate (e.g. 35.47, -97.52).'
          )}
        </span>
      </div>

      {coordenadaDigitada && (
        <ul className="lista-municipios" aria-label={tx('Coordenada digitada', 'Typed coordinate')}>
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
              <span className="municipio-nome">{tx('Usar o ponto', 'Use the point')} {formatarCoordenada(coordenadaDigitada.latitude, coordenadaDigitada.longitude)}</span>
            </button>
          </li>
        </ul>
      )}

      <div aria-live="polite">
        {falhou && <p className="mensagem-erro"><Icone nome="alerta" tamanho={20} /> {tx('Não deu para buscar agora. Veja a internet e tente de novo.', 'Could not search right now. Check your internet and try again.')}</p>}
        {buscou && !falhou && resultados.length === 0 && (
          <p className="texto-apoio">
            {tx(`Não achamos "${texto.trim()}". Confira se o nome está escrito certo.`, `We did not find "${texto.trim()}". Check the spelling.`)}
          </p>
        )}
      </div>
      {resultados.length > 0 && (
        <ul id={`${id}-lista`} className="lista-municipios" aria-label={tx('Cidades encontradas', 'Towns found')}>
          {resultados.map(m => (
            <li key={`${m.codigo_ibge}|${m.municipio}|${m.uf}|${m.latitude}`}>
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
          <Icone nome="local" tamanho={18} /> {situacaoGps === 'parado' ? tx('Usar onde estou agora', 'Use my current location') : tx('Procurando…', 'Searching…')}
        </button>
      </div>
      <div className="navegacao navegacao-unica">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> {tx('Voltar', 'Back')}
        </button>
      </div>
    </>
  );
}
