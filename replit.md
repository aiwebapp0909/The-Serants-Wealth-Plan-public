# Replit Agent Skills Repository

## Overview
This repository contains agent skill definitions and secondary skills for the Replit AI agent environment. A minimal Flask web server has been added to make the project runnable in Replit.

## Project Structure
- `main.py` — Flask web server entry point (serves on port 5000)
- `pyproject.toml` — Python project configuration with dependencies
- `.local/skills/` — Core agent skill definitions (Markdown)
- `.local/secondary_skills/` — Domain-specific agent skill definitions

## Tech Stack
- **Language:** Python 3.11
- **Web Framework:** Flask
- **Production Server:** Gunicorn
- **Port:** 5000

## Running the App
```bash
python main.py
```

## Deployment
Configured for autoscale deployment using Gunicorn:
```
gunicorn --bind=0.0.0.0:5000 --reuse-port main:app
```
