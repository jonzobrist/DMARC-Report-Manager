# DMARC Report Manager

**DMARC Report Manager** is a comprehensive toolset for parsing, analyzing, and visualizing DMARC (Domain-based Message Authentication, Reporting, and Conformance) reports. It transforms raw XML/ZIP/GZIP reports into actionable insights, helping you secure your email domain against spoofing.

## Features

- **Multi-Format Parsing**: Supports all common report formats: XML and ZIP report files, and compressed files or archives containing them in GZIP, ZIP, and XZ compression formats.
- **Interactive Dashboard**: Visualize DMARC volume, pass/fail rates, and historical trends.
- **Detailed Analysis**: Drill down into individual reports to see source IPs, DKIM/SPF results, and failure reasons.
- **Troubleshooting Tool**: built-in DNS checker to validate your SPF, DKIM, and DMARC records and suggest fixes.
- **CLI & Web Interface**: Use the command line for automation or the Web GUI for visualization.
- **API backend**: A complete API which all operations in the CLI and Web Interface are done through, with full API authentication and authorization security.
- **Privacy First**: Self-hosted and local-first. No data leaves your machine.

## Tech Stack

- **Backend**: Python 3.12+ (FastAPI, SQLite, dnspython)
- **Frontend**: React (Vite, Recharts, Lucide, Tailwind-free CSS)
- **Package Management**: `uv` (Python) and `pnpm` (Node.js)

## Screenshot
![](screenshots/DMARC-Manager-Dashboard-screenshot.png)
## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- `uv` (Python package manager)
- `pnpm` (Node package manager)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/jonzobrist/DMARC-Report-Manager.git
    cd DMARC-Report-Manager
    ```

2.  **Setup the Backend**:
    ```bash
    # Install dependencies and create virtualenv
    uv sync
    ```

3.  **Setup the Frontend**:
    ```bash
    cd frontend
    pnpm install
    ```

## Usage

### Running the Web Application

1.  **Start the Backend API**:
    ```bash
    # From project root
    uv run uvicorn backend.web.api:app --reload --port 8000
    ```

2.  **Start the Frontend Dev Server**:
    ```bash
    # From frontend/ directory
    pnpm dev
    ```
    Open your browser to `http://localhost:5173`.

### Using the CLI

The project includes a CLI for managing reports directly from the terminal.

```bash
# Get help
uv run python -m backend.cli.main --help

# Troubleshoot a domain
uv run python -m backend.cli.main troubleshoot example.com

# Import reports
uv run python -m backend.cli.main import ./path/to/reports/
```

## Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Current Features

- Multi-Format Parsing
- Interactive Dashboard
- Detailed Analysis
- Troubleshooting Tool
- CLI & Web Interface
- API backend
- Privacy First

## TODO / Roadmap

See [TODO.md](TODO.md) for a detailed list of pending work and completed features.
