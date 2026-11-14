"""Cache limitado por chave, com coalescência de requisições concorrentes."""

import copy
import threading
import time
from collections import OrderedDict

_valores = OrderedDict()
_locks = [threading.Lock() for _ in range(64)]
_guarda = threading.Lock()


def com_cache(chave: tuple, ttl: int, buscar):
    with _locks[hash(chave) % len(_locks)]:
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
