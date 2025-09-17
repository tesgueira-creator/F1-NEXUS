# Contributing

Thanks for contributing to F1-NEXUS. Quick starter steps for local development:

1. Install Python (3.11+ recommended).
1. Install Node.js LTS (for the frontend) and open a new terminal so PATH updates are active.
1. Python deps:

```powershell
cd "C:\Users\XKELU27\Documents\F1\F1-NEXUS"
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r f1-predictor-full/etl/requirements.txt
pip install -r requirements.txt || true
```

1. Run Python tests:

```powershell
py -3 -m pytest -q
```

1. Frontend (in a new PowerShell after installing Node):

```powershell
cd f1-predictor-full
npm install --no-audit --no-fund
npm run dev
```

1. Create a feature branch and a PR with a clear description of changes.

If you hit environment issues (SSL, missing packages), open an issue with logs and exact commands used.
