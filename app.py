from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Image Reviewer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "image_reviewer")

try:
    client = MongoClient(MONGO_URL)
    db = client[DATABASE_NAME]
    client.admin.command('ping')
    print("MongoDB connection successful")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    client = None
    db = None

@app.get("/")
async def root():
    return {"message": "Image Reviewer API is running"}

@app.get("/health")
async def health_check():
    mongo_status = "connected" if client else "disconnected"
    return {"status": "healthy", "mongo": mongo_status}

@app.get("/api/collections")
async def get_collections() -> List[str]:
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        collections = db.list_collection_names()
        return collections
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get collections: {str(e)}")

@app.get("/api/collections/{collection_name}/documents")
async def get_documents(collection_name: str, limit: int = 50, skip: int = 0) -> Dict[str, Any]:
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        collection = db[collection_name]
        documents = list(collection.find().skip(skip).limit(limit))
        total_count = collection.count_documents({})
        
        for doc in documents:
            doc['_id'] = str(doc['_id'])
        
        return {
            "documents": documents,
            "total": total_count,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")

@app.get("/api/collections/{collection_name}/documents/{document_id}")
async def get_document(collection_name: str, document_id: str) -> Dict[str, Any]:
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        from bson import ObjectId
        collection = db[collection_name]
        document = collection.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document['_id'] = str(document['_id'])
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document: {str(e)}")

@app.get("/api/collections/{collection_name}/documents/{document_id}/images")
async def get_document_images(collection_name: str, document_id: str) -> List[Dict[str, Any]]:
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        from bson import ObjectId
        collection = db[collection_name]
        document = collection.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        images = []
        for key, value in document.items():
            if isinstance(value, str) and (value.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'))):
                images.append({
                    "field": key,
                    "url": value,
                    "filename": os.path.basename(value)
                })
        
        return images
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document images: {str(e)}")

app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)