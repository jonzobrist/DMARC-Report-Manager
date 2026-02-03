import os
import tempfile

# Ensure all tests use an isolated database.
_TEST_DB_DIR = tempfile.TemporaryDirectory()
os.environ["DB_PATH"] = os.path.join(_TEST_DB_DIR.name, "test.db")
