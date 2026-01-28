import importlib
import traceback

try:
    importlib.import_module('app.main')
    print('IMPORT_OK')
except Exception:
    traceback.print_exc()
