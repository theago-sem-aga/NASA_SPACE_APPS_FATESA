import { tx } from '../i18n/idioma';
/**
 * Selinho verde de verificação: "Dados da NASA" (ou de agência parceira).
 * Só aparece quando a `fonte` que veio junto com o dado é da NASA ou de parceira
 * oficial do Space Apps (ESA/Copernicus). Para outras fontes (IBGE, INMET...) não mostra nada.
 * A fonte é a que o backend/mock declara no próprio dado; o selo não inventa origem.
 */
const FONTES: { teste: RegExp; nome: string; orgao: string }[] = [
  { teste: /nasa_power|nasa power/i, nome: 'POWER', orgao: 'NASA' },
  { teste: /^gpm$|imerg/i, nome: 'GPM/IMERG', orgao: 'NASA' },
  { teste: /^smap$/i, nome: 'SMAP', orgao: 'NASA' },
  { teste: /^srtm$/i, nome: 'SRTM', orgao: 'NASA' },
  { teste: /ecostress/i, nome: 'ECOSTRESS', orgao: 'NASA' },
  { teste: /landsat/i, nome: 'Landsat', orgao: 'NASA/USGS' },
  { teste: /modis|viirs/i, nome: 'MODIS/VIIRS', orgao: 'NASA' },
  { teste: /grace/i, nome: 'GRACE', orgao: 'NASA' },
  { teste: /gldas/i, nome: 'GLDAS', orgao: 'NASA' },
  { teste: /sentinel-?2/i, nome: 'Sentinel-2', orgao: 'ESA/Copernicus' },
  { teste: /era5/i, nome: 'ERA5', orgao: 'ESA/Copernicus' }
];

export function origemOficial(fonte: string | null | undefined) {
  if (!fonte) return null;
  return FONTES.find(f => f.teste.test(fonte)) ?? null;
}

export function SeloFonte({ fonte }: { fonte: string | null | undefined }) {
  const o = origemOficial(fonte);
  if (!o) return null;
  const parceira = o.orgao !== 'NASA' && o.orgao !== 'NASA/USGS';
  const texto = parceira
    ? tx(`Dados da ${o.orgao}, parceira da NASA · ${o.nome}`, `${o.orgao} data, a NASA partner · ${o.nome}`)
    : tx(`Dados da NASA · ${o.nome}`, `NASA data · ${o.nome}`);
  return (
    <span className="selo-fonte" title={`${texto} (${o.orgao})`}>
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M8 0.8l1.8 1.3 2.2-.2.7 2.1 1.9 1.1-.6 2.1.6 2.1-1.9 1.1-.7 2.1-2.2-.2L8 15.2l-1.8-1.3-2.2.2-.7-2.1-1.9-1.1.6-2.1-.6-2.1 1.9-1.1.7-2.1 2.2.2z"
          fill="currentColor"
        />
        <path d="M5 8.2l2 2 4-4.2" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {texto}
    </span>
  );
}
