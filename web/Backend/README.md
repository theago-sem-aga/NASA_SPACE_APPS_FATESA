# Backend

Placeholder para a futura API e processamento de dados. Ainda não contém aplicação implementada.

A direção técnica é Python + FastAPI. Consulte as [convenções do projeto](../../docs/convencao_programacao.md) antes de implementar.

## Rodar a API

```bash
cd web/Backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # só na primeira vez
cd app && ../.venv/bin/uvicorn main:app --port 8000
```

Contrato em `docs/contrato_api.md`. `/api/v1/analises` precisa do PostgreSQL/PostGIS configurado (`web/.env`); `/api/v1/acompanhamento` não precisa de banco.
