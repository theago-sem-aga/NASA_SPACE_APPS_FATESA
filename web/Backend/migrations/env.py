from alembic import context

from app.repositories.banco import Base, motor_banco

with motor_banco().connect() as conexao:
    context.configure(connection=conexao, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()
