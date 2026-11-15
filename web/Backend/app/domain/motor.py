"""Motor beta determinístico. Saídas são hipóteses, nunca prescrição local.

O modo beta serve para validar a integração das telas. Não há limiares de seca,
erosão, produtividade ou retorno econômico aprovados para produção.
"""

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
    """
    definicoes = [
        (
            "referencia_beta",
            "Referência sem cultura intermediária (hipótese)",
            [],
            "solo_descoberto",
        ),
        (
            "graminea_beta",
            "Explorar cobertura com gramínea",
            ["reducao_erosao", "materia_organica"],
            "cultura_intermediaria",
        ),
        (
            "leguminosa_beta",
            "Explorar cobertura com leguminosa",
            ["fixacao_nitrogenio", "materia_organica"],
            "adubo_verde",
        ),
    ]
    estrategias = []
    for indice, (identificador, nome, prioridades, cobertura) in enumerate(definicoes):
        coincidencias = [p for p in entrada.prioridades if p in prioridades]
        lacunas = [
            "Calendário e níveis de comparação são simulados, já que as datas reais de plantio e colheita não foram informadas.",
            "Não sabemos a espécie, cultivar, análise de solo e histórico de manejo necessários para recomendar esta opção.",
        ]
        riscos = [
            "A janela de manejo e a disponibilidade de água precisam ser conferidas antes de plantar."
        ]
        if entrada.recursos_disponiveis.irrigacao != "sim":
            riscos.append(
                "Como a irrigação não foi confirmada, o sistema não garante o estabelecimento da cobertura apenas com a chuva histórica."
            )
        if "nematoides_pragas" in entrada.problemas:
            lacunas.append(
                "Como a praga não foi identificada, não há indicação de controle nem escolha de espécie a partir desse relato."
            )
        if entrada.origem_local == "municipio":
            lacunas.append("A localização é aproximada e não representa os limites do seu talhão.")
        estrategias.append(
            Estrategia(
                estrategia_id=identificador,
                nome=nome,
                resumo="É um cenário simulado para explorar a conversa com um técnico, e não uma recomendação validada para o seu talhão.",
                eh_pratica_atual=indice == 0,
                objetivo="Comparar hipóteses de manejo entre ciclos da cultura principal.",
                motivos=[
                    "Isto coincide com uma prioridade informada."
                    if coincidencias
                    else "É uma referência exploratória para comparação.",
                    "A ordem usa apenas a quantidade de prioridades coincidentes, sem previsão de desempenho.",
                ],
                evidencias=[
                    "A referência consultada discute coberturas em sistemas anuais da Califórnia, mas não valida este calendário simulado."
                ],
                beneficios=[
                    "Há possível aporte de resíduos vegetais, mas o efeito local depende do manejo."
                ]
                if indice
                else ["É uma referência de comparação, sem benefício agronômico quantificado."],
                riscos=riscos,
                lacunas=lacunas,
                confianca="baixa",
                explicacao_confianca="É uma hipótese beta sem validação local, e essa confiança não é probabilidade de sucesso.",
                pergunta_especialista="Esta cobertura cabe entre as minhas safras sem comprometer água e manejo?",
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
                },
                etapas_rotacao=[
                    {
                        "cultura_id": entrada.cultura_atual_id,
                        "nome": "Cultura principal",
                        "duracao_meses": None,
                    },
                    {"cultura_id": identificador, "nome": nome, "duracao_meses": None},
                    {
                        "cultura_id": entrada.cultura_atual_id,
                        "nome": "Próxima safra",
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
                    f"No calendário SIMULADO, os meses descobertos coincidem com {acumulado / total:.1%} da chuva histórica média anual, "
                    "mas isso é uma comparação de calendário, não uma estimativa de erosão ou previsão de chuva."
                )
    return sorted(estrategias, key=lambda e: -len(e.prioridades_atendidas))
