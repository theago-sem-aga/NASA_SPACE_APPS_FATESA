from app.domain.motor import caracterizar_talhao, gerar_cenarios
from app.schemas.analises import Correcoes


def test_sem_regra_nao_inventa_caracteristicas(entrada):
    r = caracterizar_talhao(entrada)
    assert r.declividade_pct is None
    assert r.risco_seca is None
    assert r.risco_erosao is None
    assert r.textura_solo is None


def test_correcao_preserva_origem(entrada):
    entrada.correcoes = Correcoes(textura_solo="arenosa", relevo="plano")
    r = caracterizar_talhao(entrada)
    assert r.fonte_textura == r.fonte_relevo == "informado_produtor"
    assert r.textura_solo == "arenosa"
    assert r.declividade_pct is None


def test_beta_deterministico_prioridade_sem_promessa(entrada):
    r = gerar_cenarios(entrada)
    assert r == gerar_cenarios(entrada)
    assert r[0].estrategia_id == "leguminosa_beta"
    assert len(r) == 3
    assert sum(e.eh_pratica_atual for e in r) == 1
    assert all(e.confianca == "baixa" for e in r)
    assert all("simulad" in e.lacunas[0] for e in r)
    assert all(len(e.calendario) == 12 for e in r)
    assert all(any("Irrigação" in risco for risco in e.riscos) for e in r)


def test_prioridade_muda_ordem(entrada):
    entrada.prioridades = ["reducao_erosao"]
    assert gerar_cenarios(entrada)[0].estrategia_id == "graminea_beta"


def test_chuva_real_cruzada_so_com_calendario_hipotetico(entrada):
    clima = [{"mes": m, "precipitacao_acumulada_mm": 10} for m in range(1, 13)]
    r = gerar_cenarios(entrada, clima)
    base = next(e for e in r if e.eh_pratica_atual)
    assert any("33.3%" in e and "SIMULADO" in e for e in base.evidencias)
    clima[0]["precipitacao_acumulada_mm"] = None
    r = gerar_cenarios(entrada, clima)
    assert not any("chuva histórica" in e for estrategia in r for e in estrategia.evidencias)
