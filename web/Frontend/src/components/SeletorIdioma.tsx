import { mudarIdioma, useIdioma, type Idioma } from '../i18n/idioma';

// Duas bandeiras no cabeçalho: EUA = inglês (principal), Brasil = português.
// Desenho simplificado próprio; o nome do idioma vai no rótulo para leitor de tela.

function BandeiraEUA() {
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true">
      <rect width="30" height="20" fill="#ffffff" />
      {[0, 2, 4, 6, 8, 10, 12].map(i => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
      ))}
      <rect width="13" height={(20 / 13) * 7} fill="#3c3b6e" />
      {[0, 1, 2].map(l =>
        [0, 1, 2, 3].map(c => <circle key={`${l}-${c}`} cx={2 + c * 3} cy={2 + l * 3.3} r="0.7" fill="#ffffff" />)
      )}
    </svg>
  );
}

function BandeiraBrasil() {
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true">
      <rect width="30" height="20" fill="#009c3b" />
      <path d="M15 2.5 27 10 15 17.5 3 10Z" fill="#ffdf00" />
      <circle cx="15" cy="10" r="4.6" fill="#002776" />
      <path d="M10.6 9.2c2.9-.6 6-.2 8.7 1.1" stroke="#ffffff" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

const OPCOES: { idioma: Idioma; rotulo: string; Bandeira: () => JSX.Element }[] = [
  { idioma: 'en', rotulo: 'English', Bandeira: BandeiraEUA },
  { idioma: 'pt', rotulo: 'Português', Bandeira: BandeiraBrasil }
];

export function SeletorIdioma() {
  const idioma = useIdioma();
  return (
    <div className="seletor-idioma" role="group" aria-label={idioma === 'pt' ? 'Idioma' : 'Language'}>
      {OPCOES.map(({ idioma: i, rotulo, Bandeira }) => (
        <button
          key={i}
          type="button"
          className="botao-bandeira"
          aria-pressed={idioma === i}
          aria-label={rotulo}
          title={rotulo}
          lang={i === 'pt' ? 'pt-BR' : 'en'}
          onClick={() => mudarIdioma(i)}
        >
          <Bandeira />
        </button>
      ))}
    </div>
  );
}
