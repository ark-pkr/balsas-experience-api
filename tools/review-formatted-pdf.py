from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name("finalize-unibalsas.py")), run_name="__main__")
