from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from typing import List, Dict, Any
import os
import boto3
from botocore.exceptions import ClientError
import mimetypes
from io import BytesIO
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

MONGO_URL = os.getenv("MONGO_URL", "mongodb://torch:torch@localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "torch")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "torch-prod-images")

try:
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client[DATABASE_NAME]
    mongo_client.admin.command('ping')
    print("MongoDB connection successful")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    mongo_client = None
    db = None

# Initialize S3 client
try:
    s3_client = boto3.client('s3')
    print("S3 client initialized successfully")
except Exception as e:
    print(f"S3 client initialization failed: {e}")
    s3_client = None

@app.get("/")
async def root():
    return {"message": "Image Reviewer API is running"}

@app.get("/health")
async def health_check():
    mongo_status = "connected" if mongo_client else "disconnected"
    s3_status = "connected" if s3_client else "disconnected"
    return {"status": "healthy", "mongo": mongo_status, "s3": s3_status}

@app.get("/api/collections")
async def get_collections() -> List[str]:
    if mongo_client is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        collections = db.list_collection_names()
        return collections
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get collections: {str(e)}")

@app.get("/api/collections/{collection_name}/documents")
async def get_documents(collection_name: str, limit: int = 50, skip: int = 0) -> Dict[str, Any]:
    if mongo_client is None:
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
    if mongo_client is None:
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
    if mongo_client is None:
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

@app.get("/api/image-validity/random")
async def get_random_image_validity_documents(limit: int = 100) -> List[Dict[str, Any]]:
    if mongo_client is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Access the model_results database and image_validity collection
        model_results_db = mongo_client["model_results"]
        collection = model_results_db["image_validation"]

        # Limit the number of documents to maximum 100
        limit = min(limit, 100)

        # Use MongoDB's $sample to get random documents
        pipeline = [{"$sample": {"size": limit}}]
        documents = list(collection.aggregate(pipeline))

        # Convert ObjectId to string for JSON serialization
        for doc in documents:
            doc['_id'] = str(doc['_id'])

        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get random image validity documents: {str(e)}")

@app.get("/api/image/{s3_key:path}")
async def serve_s3_image(s3_key: str):
    if not s3_client:
        raise HTTPException(status_code=500, detail="S3 client not available")

    try:
        # Get the object from S3
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)

        # Read the image data
        image_data = response['Body'].read()

        # Determine content type based on file extension
        content_type = mimetypes.guess_type(s3_key)[0]
        if not content_type:
            # Default to jpeg if we can't determine the type
            content_type = "image/jpeg"

        # Return the image as a streaming response
        return StreamingResponse(
            BytesIO(image_data),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                "Content-Length": str(len(image_data))
            }
        )

    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            raise HTTPException(status_code=404, detail=f"Image not found: {s3_key}")
        elif error_code == 'AccessDenied':
            raise HTTPException(status_code=403, detail="Access denied to S3 bucket")
        else:
            raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to serve image: {str(e)}")

# app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
