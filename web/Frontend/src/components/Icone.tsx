const CAMINHOS = {
  voltar: <path d="M15 5l-7 7 7 7" />,
  casa: <path d="M4 11l8-7 8 7M6 9.5V20h4.5v-5.5h3V20H18V9.5" />,
  seguir: <path d="M9 5l7 7-7 7" />,
  local: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  ouvir: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </>
  ),
  parar: <rect x="6" y="6" width="12" height="12" rx="2" />,
  ok: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 12.5l3 3 6-7" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18h.01" />
    </>
  ),
  pergunta: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.7-2.5 2-2.5 4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
  alvo: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  dados: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  pessoa: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 4h5v4h-2l-2 2V8h-1z" />
    </>
  ),
  tubo: <path d="M9 3h6M10 3v7l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7 15h10" />,
  imprimir: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M8.5 15l2.5 2.5 4.5-4.5" />
    </>
  )
};

export type NomeIcone = keyof typeof CAMINHOS;

export function Icone({ nome, tamanho = 24 }: { nome: NomeIcone; tamanho?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icone"
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
