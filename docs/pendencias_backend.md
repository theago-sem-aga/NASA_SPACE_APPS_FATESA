# Pendências após a entrega beta

Ordem sugerida para revisão conjunta, sem decisões agronômicas implícitas:

1. **Catálogo agronômico real.** Confirmar culturas e sistemas da Califórnia,
   calendário, manejo atual e referências por regra. Hoje milho é apenas o
   identificador habilitado no beta; não há avaliação de aptidão por cultura.
2. **Substituir simulações.** Três cenários, níveis ordinais, calendário e
   correspondência de prioridades são explícitos exemplos. Não são recomendações
   validadas. Só então trocar estado_recomendacoes e retirar eh_mock.
3. **Características do talhão.** Definir classificação de textura e seleção/
   ponderação de componentes do USDA, derivar declividade do raster com método
   apropriado e estabelecer métodos de seca/erosão. Hoje esses resultados são null,
   exceto correções autorrelatadas; não inferir declividade de min/máx de elevação.
4. **Qualidade e histórico dos pipelines do Tiago.** Produtos precisam de versões,
   unidades, datas e flags de qualidade auditados (nuvens HLS, qualidade SMAP,
   nodata/escala ECOSTRESS). Há data SRTM inconsistente no pipeline e os scripts
   atuais sobrescrevem o Parquet da célula ao ingerir outra data: preparar acúmulo
   de histórico antes de baixar séries. Não alteramos os datasets nesta entrega.
5. **Cobertura espacial.** Existem 60 registros de células, não cobertura de todo
   Fresno nem de todas as fontes em todo ponto. SMAP não cobre o ponto exato de
   referência no índice atual. Regras de borda estão determinísticas, mas não
   tornam uma grade grosseira uma medição do talhão.
6. **Credenciais e fontes.** Configurar OPENET_API_KEY localmente, se for usado;
   NASS exige chave e associação administrativa por condado antes de integrar.
   Não presumir cultura, produção ou mercado a partir do ponto.
7. **Frontend.** Adaptar rótulos e demonstração para Califórnia, manter avisos
   beta visíveis e impedir fallback mock silencioso na entrega final. TelaClima
   precisa distinguir chuva ausente de cobertura integral (ramo else atual).
   Pictogramas dos novos cenários podem cair no genérico; fotos ainda são do mock.
8. **Latência.** Cold start consulta fontes externas. Cache e paralelismo ajudam,
   mas não há prazo global nem jobs assíncronos. Medir em hospedagem antes de
   definir contrato 202/polling; pré-aquecer ponto piloto para a demonstração.
9. **Deploy e acesso.** HTTPS, domínios CORS, autenticação/autorização, limitação
   de tráfego e política de retenção de coordenadas/análises para exposição pública.
   UUID não substitui permissão de acesso. Serviço atual é local de demonstração.
10. **Brasil.** Malha oficial, catálogo municipal, fontes de solo e recorte NASA
    brasileiro só entram depois da Califórnia, conforme orientação de Ghabriel.

Ferramentas frontend: npm install informou duas vulnerabilidades nas dependências
existentes. Não executamos correção forçada nem alteramos a stack do frontend.
