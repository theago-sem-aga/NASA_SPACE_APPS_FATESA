"""Motor beta determinístico. Saídas são hipóteses, nunca prescrição local.

O modo beta serve para validar a integração das telas. Não há limiares de seca,
erosão, produtividade ou retorno econômico aprovados para produção.
"""

from app.i18n import texto
from app.schemas.analises import CaracteristicasTalhao, Estrategia

VERSAO = "0.2.0-beta-cenarios"
REF21 = "UC Cooperative Extension — Selecting Cover Crops for California Annual Crop Systems (2024): https://agric.ucdavis.edu/sites/g/files/dgvnsk12316/files/inline-files/Fact%20Sheet_21%20Selecting%20Cover%20Crops.pdf"
REF22 = "UC Cooperative Extension — Cover Cropping Considerations in California Annual Crop Rotations (2024): https://agric.ucdavis.edu/sites/g/files/dgvnsk12316/files/inline-files/Fact%20Sheet_22%20Cover%20Cropping%20Considerations.pdf"


def caracterizar_talhao(entrada):
    # Sem método agronômico homologado, não inferir textura/risco/declividade.
    return CaracteristicasTalhao(
        textura_solo=entrada.correcoes.textura_solo,
        fonte_textura="informado_produtor" if entrada.correcoes.textura_solo else "mapas",
        relevo=entrada.correcoes.relevo,
        fonte_relevo="informado_produtor" if entrada.correcoes.relevo else "mapas",
    )


def gerar_cenarios(entrada, clima_mensal=None):
    """Calendário e níveis abaixo são deliberadamente simulados para teste.

    Ordenação: quantidade de prioridades coincidentes, sem pesos científicos.
    Empate mantém a ordem editorial. Sem estimativa de renda/água economizada.
    Textos no idioma da entrada (`idioma`, padrão português).
    """
    idioma = getattr(entrada, "idioma", "pt")

    def t(pt: str, en: str) -> str:
        return texto(idioma, pt, en)

    definicoes = [
        (
            "referencia_beta",
            t("Referência sem cultura intermediária (hipótese)", "Baseline with no gap crop (hypothesis)"),
            [],
            "solo_descoberto",
        ),
        (
            "graminea_beta",
            t("Explorar cobertura com gramínea", "Explore a grass cover crop"),
            ["reducao_erosao", "materia_organica"],
            "cultura_intermediaria",
        ),
        (
            "leguminosa_beta",
            t("Explorar cobertura com leguminosa", "Explore a legume cover crop"),
            ["fixacao_nitrogenio", "materia_organica"],
            "adubo_verde",
        ),
    ]
    estrategias = []
    for indice, (identificador, nome, prioridades, cobertura) in enumerate(definicoes):
        coincidencias = [p for p in entrada.prioridades if p in prioridades]
        lacunas = [
            t("Calendário e níveis de comparação são simulados; as datas reais de plantio e colheita não foram informadas.",
              "Calendar and comparison levels are simulated; the real planting and harvest dates were not provided."),
            t("Não sabemos a espécie, cultivar, análise de solo e histórico de manejo necessários para recomendar esta opção.",
              "We do not know the species, cultivar, soil test and management history needed to recommend this option."),
        ]
        riscos = [
            t("A janela de manejo e a disponibilidade de água precisam ser conferidas antes de plantar.",
              "The management window and water availability must be checked before planting.")
        ]
        if entrada.recursos_disponiveis.irrigacao != "sim":
            riscos.append(
                t("Irrigação não confirmada. O sistema não garante estabelecimento da cobertura com a chuva histórica.",
                  "Irrigation not confirmed. The system does not guarantee the cover crop will establish with historical rain.")
            )
        if "nematoides_pragas" in entrada.problemas:
            lacunas.append(
                t("A praga não foi identificada. Não há indicação de controle nem escolha de espécie por esse relato.",
                  "The pest was not identified. This report gives no control advice or species choice.")
            )
        if entrada.origem_local == "municipio":
            lacunas.append(
                t("A localização é aproximada e não representa os limites do seu talhão.",
                  "The location is approximate and does not represent the boundaries of your field.")
                if entrada.codigo_ibge
                else t("Coordenada digitada (ou centro de uma cidade fora do Brasil): confirme se o ponto representa o talhão.",
                       "Typed coordinate (or the center of a town outside Brazil): confirm that the point represents your field.")
            )
        estrategias.append(
            Estrategia(
                estrategia_id=identificador,
                nome=nome,
                resumo=t("Planejamento baseado em um número limitado de dados; precisa ser revisado por um agrônomo.",
                         "Planning based on a limited amount of data; it needs to be reviewed by an agronomist."),
                eh_pratica_atual=indice == 0,
                objetivo=t("Comparar hipóteses de manejo entre ciclos da cultura principal.",
                           "Compare management hypotheses between cycles of the main crop."),
                motivos=[
                    t("Coincide com uma prioridade informada.", "Matches a priority you gave.")
                    if coincidencias
                    else t("Referência exploratória para comparação.", "Exploratory baseline for comparison."),
                    t("A ordem usa apenas a quantidade de prioridades coincidentes, sem previsão de desempenho.",
                      "The order uses only the number of matching priorities, with no performance forecast."),
                ],
                evidencias=[
                    t("A referência consultada discute coberturas em sistemas anuais da Califórnia; não valida este calendário simulado.",
                      "The reference consulted discusses cover crops in California annual systems; it does not validate this simulated calendar.")
                ],
                beneficios=[
                    t("Possível aporte de resíduos vegetais; o efeito local depende do manejo.",
                      "Possible addition of plant residue; the local effect depends on management.")
                ]
                if indice
                else [t("Referência de comparação, sem benefício agronômico quantificado.",
                        "Comparison baseline, with no quantified agronomic benefit.")],
                riscos=riscos,
                lacunas=lacunas,
                confianca="baixa",
                explicacao_confianca=t("Hipótese beta sem validação local. Confiança não é probabilidade de sucesso.",
                                       "Beta hypothesis with no local validation. Confidence is not a probability of success."),
                pergunta_especialista=t("Esta cobertura cabe entre as minhas safras sem comprometer água e manejo?",
                                        "Does this cover crop fit between my crops without compromising water and management?"),
                prioridades_atendidas=coincidencias,
                requisitos=[],
                atributos={
                    "protecao_solo": "medio" if indice else "nenhum",
                    "materia_organica": "medio" if indice else "nenhum",
                    "fixacao_nitrogenio": "medio" if indice == 2 else "nenhum",
                    "quebra_pragas": "nenhum",
                    "renda_direta": "nenhum",
                    "demanda_agua": "medio" if indice else "nenhum",
                    "trabalho_custo": "medio" if indice else "baixo",
                    "valor_forragem": "nenhum",
                },
                etapas_rotacao=[
                    {
                        "cultura_id": entrada.cultura_atual_id,
                        "nome": t("Cultura principal", "Main crop"),
                        "duracao_meses": None,
                    },
                    {"cultura_id": identificador, "nome": nome, "duracao_meses": None},
                    {
                        "cultura_id": entrada.cultura_atual_id,
                        "nome": t("Próxima safra", "Next crop"),
                        "duracao_meses": None,
                    },
                ],
                referencias=[REF21, REF22],
                calendario=[
                    {
                        "mes": mes,
                        "cobertura": cobertura if mes in (11, 12, 1, 2) else "cultura_principal",
                    }
                    for mes in range(1, 13)
                ],
            )
        )
    if (
        clima_mensal
        and len(clima_mensal) == 12
        and all(m["precipitacao_acumulada_mm"] is not None for m in clima_mensal)
    ):
        chuva = {m["mes"]: m["precipitacao_acumulada_mm"] for m in clima_mensal}
        total = sum(chuva.values())
        for estrategia in estrategias:
            descobertos = {m.mes for m in estrategia.calendario if m.cobertura == "solo_descoberto"}
            acumulado = sum(chuva[m] for m in descobertos)
            if total > 0:
                estrategia.evidencias.append(
                    t(
                        f"No calendário SIMULADO, os meses descobertos coincidem com {acumulado / total:.1%} da chuva histórica média anual. "
                        "É uma comparação de calendário, não uma estimativa de erosão ou previsão de chuva.",
                        f"In the SIMULATED calendar, the bare months hold {acumulado / total:.1%} of the average yearly historical rain. "
                        "It is a calendar comparison, not an erosion estimate or a rain forecast.",
                    )
                )
    return sorted(estrategias, key=lambda e: -len(e.prioridades_atendidas))
