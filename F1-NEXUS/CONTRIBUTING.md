# Contributing

Thanks for contributing to F1-NEXUS! This guide will help you set up your local development environment and contribute to the project.

## Development Environment Setup

### Prerequisites

- Python 3.11+ ([Download Python](https://www.python.org/downloads/))
- Node.js LTS 18+ ([Download Node.js](https://nodejs.org/))
- Git ([Download Git](https://git-scm.com/downloads))

### 1. Clone and Setup

```bash
git clone https://github.com/tesgueira-creator/F1-NEXUS.git
cd F1-NEXUS
```

### 2. Python Environment

Create and activate a virtual environment:

**Linux/macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (Command Prompt):**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Install Python dependencies:
```bash
pip install -r etl/requirements.txt
pip install -r F1-NEXUS/f1-predictor-full/etl/requirements.txt
pip install pytest  # For testing
```

### 3. Frontend Environment

```bash
cd F1-NEXUS/f1-predictor-full
npm install --no-audit --no-fund
```

### 4. Verify Installation

**Run Python tests:**
```bash
# From repository root
python -m pytest F1-NEXUS/tests/ -v
```

**Test version utilities:**
```bash
python F1-NEXUS/scripts/version_demo.py
```

**Start frontend development server:**
```bash
cd F1-NEXUS/f1-predictor-full
npm run dev
```

Visit `http://localhost:3000` to verify the frontend is running.

### 5. ETL Pipeline Testing

Test the ETL pipeline with sample data:
```bash
cd etl
python test_robustness.py
```

## Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project conventions

3. **Test your changes:**
   ```bash
   # Run Python tests
   python -m pytest F1-NEXUS/tests/ -v
   
   # Run frontend tests (if available)
   cd F1-NEXUS/f1-predictor-full
   npm test
   
   # Test build
   npm run build
   ```

4. **Create a pull request** with a clear description of your changes

## Project Structure

- `F1-NEXUS/f1-predictor-full/` - Next.js frontend application
  - `app/` - Next.js app router pages
  - `components/` - React components
  - `lib/` - Frontend utilities
  - `public/` - Static assets
- `etl/` - Python ETL pipeline
  - `make_all.py` - Main ETL orchestrator
  - `requirements.txt` - Python dependencies
- `F1-NEXUS/lib/` - Shared Python utilities
- `F1-NEXUS/tests/` - Unit tests
- `docs/` - Documentation

## Code Style

- **Python**: Follow PEP 8 conventions
- **TypeScript/JavaScript**: Use consistent formatting (consider using Prettier)
- **Commit messages**: Use clear, descriptive commit messages

## Common Issues and Solutions

### SSL/Network Issues

If you encounter SSL or network issues when running ETL scripts:
- Check your internet connection
- Try using `--insecure` flag for development (not recommended for production)
- Ensure your Python environment has updated certificates

### Environment Issues

If you hit environment setup issues:
1. Ensure you're using the correct Python/Node versions
2. Check that your virtual environment is activated
3. Clear package caches: `pip cache purge` and `npm cache clean --force`
4. Open an issue with logs and exact commands used

### FastF1 Cache Issues

The ETL pipeline uses FastF1 which caches data. If you encounter cache-related issues:
- Set `FASTF1_CACHE` environment variable to a writable directory
- Clear the cache directory if data seems stale

## Getting Help

- Check existing [issues](https://github.com/tesgueira-creator/F1-NEXUS/issues)
- Create a new issue with detailed reproduction steps
- Contact maintainers via GitHub

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.
