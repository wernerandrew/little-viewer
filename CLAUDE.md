# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Image Reviewer is a full-stack web application that allows users to browse MongoDB collections and view images referenced in documents. The application consists of a FastAPI Python backend and a React TypeScript frontend.

## Architecture

### Backend (Python/FastAPI)
- **app.py**: Main FastAPI application with MongoDB integration
- **requirements.txt**: Python dependencies
- MongoDB connection on localhost:27017 (configurable via environment variables)
- API endpoints for collection enumeration, document browsing, and image discovery

### Frontend (React/TypeScript)
- **frontend/**: React application with TypeScript
- **webpack.config.js**: Custom webpack configuration with dev server proxy
- **src/App.tsx**: Main application component with navigation state
- **src/components/**: Reusable React components
  - CollectionList: Displays available MongoDB collections
  - DocumentList: Shows documents within a selected collection
  - ImageBrowser: Displays images found in document fields

## Common Commands

### Backend Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python app.py
# Or with uvicorn
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
# Install frontend dependencies
cd frontend && npm install

# Start development server (with proxy to backend)
npm start

# Build for production
npm run build
```

### Full Application
1. Start MongoDB on localhost:27017
2. Start backend: `python app.py`
3. Start frontend: `cd frontend && npm start`
4. Access application at http://localhost:3000

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- `MONGO_URL`: MongoDB connection string (default: mongodb://localhost:27017)
- `DATABASE_NAME`: Target database name (default: image_reviewer)

## Image Detection Logic

The application automatically detects images by scanning document fields for URLs ending with common image extensions (.jpg, .jpeg, .png, .gif, .bmp, .webp). This logic is implemented in the `/api/collections/{collection_name}/documents/{document_id}/images` endpoint.