# F1-NEXUS

A comprehensive Formula 1 prediction and analytics web application that combines real-time race data with weather forecasting to generate race predictions and insights.

## Features

- **Real-time F1 Data**: Fetch live race sessions, driver performance, and historical data using FastF1
- **Weather Integration**: Incorporate weather forecasting from OpenMeteo API for enhanced predictions
- **Interactive Frontend**: Next.js-based web application with data visualization and prediction displays
- **ETL Pipeline**: Robust data processing pipeline for session data and race features
- **Prediction Engine**: Advanced algorithms for race outcome predictions

## Quick Start

### Prerequisites

- Python 3.11+ 
- Node.js LTS (18+)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/tesgueira-creator/F1-NEXUS.git
   cd F1-NEXUS
   ```

2. **Python Environment Setup**
   ```bash
   # Create virtual environment
   python3 -m venv .venv
   
   # Activate virtual environment
   # On Linux/macOS:
   source .venv/bin/activate
   # On Windows:
   .venv\Scripts\activate
   
   # Install Python dependencies
   pip install -r etl/requirements.txt
   pip install pytest  # For running tests
   ```

3. **Frontend Setup**
   ```bash
   cd F1-NEXUS/f1-predictor-full
   npm install --no-audit --no-fund
   ```

4. **Run Tests**
   ```bash
   # From repository root
   python -m pytest F1-NEXUS/tests/ -v
   ```

5. **Start Development Server**
   ```bash
   cd F1-NEXUS/f1-predictor-full
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

### ETL Pipeline Usage

Generate race data and features:

```bash
# Example: Generate data for a specific race
cd etl
python make_all.py --circuit monza --season 2024 --round 16 --date 2024-09-01
```

### Project Structure

- `F1-NEXUS/f1-predictor-full/` - Next.js frontend application
- `etl/` - Python ETL scripts for data processing
- `F1-NEXUS/lib/` - Core utility libraries
- `F1-NEXUS/tests/` - Unit tests
- `docs/` - Documentation and guides

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## Maintainers

- [@tesgueira-creator](https://github.com/tesgueira-creator)

## License

This project is private. All rights reserved.
