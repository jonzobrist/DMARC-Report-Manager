import shutil
import tempfile
import sys
import os
from pathlib import Path

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from backend.dmarc_lib.parser import parse_report
from backend.dmarc_lib.db import save_report, DB_PATH

def test_logic():
    sample_file = Path("tests/data/valid/google_sample.xml")
    if not sample_file.exists():
        print(f"File not found: {sample_file}")
        return

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        dest = temp_path / sample_file.name
        shutil.copy(sample_file, dest)
        
        print(f"Parsing {dest}...")
        try:
            feedback = parse_report(dest)
            print("Parsing successful.")
        except Exception as e:
            print(f"Parsing failed: {e}")
            raise

        print("Saving report...")
        try:
            save_report(feedback, DB_PATH)
            print("Saving successful.")
        except Exception as e:
            print(f"Saving failed: {e}")
            raise
            
        print("Success!")

if __name__ == "__main__":
    test_logic()
