import { tx } from '../i18n/idioma';
/**
 * Uma linha simples embaixo do botão, só enquanto o navegador está perguntando.
 * Sem seta para um canto: a pergunta do navegador muda de lugar em cada aparelho.
 */
export function DicaPermissao() {
  return (
    <p className="dica-permissao" role="status">
      <span aria-hidden="true">👆</span> {tx('Se o celular perguntar, toque em', 'If your phone asks, tap')} <strong>{tx('Permitir', 'Allow')}</strong>.
    </p>
  );
}
