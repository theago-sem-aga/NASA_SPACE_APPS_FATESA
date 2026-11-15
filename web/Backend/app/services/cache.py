"""Cache limitado por chave, com coalescência de requisições concorrentes."""

import copy
import threading
import time
from collections import OrderedDict
from contextlib import contextmanager

_valores = OrderedDict()
_locks = {}
_guarda = threading.Lock()


@contextmanager
def _trava_por_chave(chave):
    # Travas agrupadas por hash podiam colidir em consultas aninhadas (fonte ->
    # série climática) e bloquear a própria thread. Manter a chave completa e
    # referências aos aguardantes evita colisão e crescimento indefinido.
    with _guarda:
        trava, referencias = _locks.get(chave, (threading.RLock(), 0))
        _locks[chave] = (trava, referencias + 1)
    try:
        with trava:
            yield
    finally:
        with _guarda:
            trava, referencias = _locks[chave]
            if referencias == 1:
                del _locks[chave]
            else:
                _locks[chave] = (trava, referencias - 1)


def com_cache(chave: tuple, ttl: int, buscar):
    with _trava_por_chave(chave):
        with _guarda:
            item = _valores.get(chave)
            if item and item[0] > time.monotonic():
                _valores.move_to_end(chave)
                return copy.deepcopy(item[1])
        valor = buscar()  # exceções não são cacheadas
        with _guarda:
            _valores[chave] = (time.monotonic() + ttl, copy.deepcopy(valor))
            _valores.move_to_end(chave)
            while len(_valores) > 256:
                _valores.popitem(last=False)
        return valor
