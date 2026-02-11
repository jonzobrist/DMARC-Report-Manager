# DMARC Report Manager - Backend (FastAPI + uvicorn)
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Install dependencies first (cache layer)
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --no-install-project

# Copy backend source
COPY backend/ ./backend/
COPY main.py ./
COPY bin/ ./bin/

# Data volume for SQLite DB
VOLUME /app/data

ENV DB_PATH=/app/data/dmarc_reports.db
ENV APP_HOST=0.0.0.0

EXPOSE 8100

CMD ["uv", "run", "uvicorn", "backend.web.api:app", "--host", "0.0.0.0", "--port", "8100"]
