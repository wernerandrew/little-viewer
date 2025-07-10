import React, { useState } from 'react';

interface Document {
  _id: string;
  [key: string]: any;
}

interface Image {
  field: string;
  url: string;
  filename: string;
}

interface ImageBrowserProps {
  document: Document;
  images: Image[];
}

const ImageBrowser: React.FC<ImageBrowserProps> = ({ document, images }) => {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (url: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
  };

  const handleImageError = (url: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(url);
      return newSet;
    });
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(url);
      return newSet;
    });
  };

  const handleImageLoadStart = (url: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.add(url);
      return newSet;
    });
  };

  return (
    <div className="image-browser">
      <h3>Document: {document._id}</h3>
      
      <div className="document-details">
        <h4>Document Data:</h4>
        <pre>{JSON.stringify(document, null, 2)}</pre>
      </div>

      <div className="images-section">
        <h4>Images Found: {images.length}</h4>
        
        {images.length === 0 ? (
          <div className="no-images">
            <p>No images found in this document.</p>
            <p>The system looks for fields containing URLs ending with common image extensions (.jpg, .jpeg, .png, .gif, .bmp, .webp).</p>
          </div>
        ) : (
          <div className="image-grid">
            {images.map((image, index) => (
              <div key={index} className="image-item">
                <h4>Field: {image.field}</h4>
                <p>Filename: {image.filename}</p>
                <p>URL: {image.url}</p>
                
                {failedImages.has(image.url) ? (
                  <div className="image-placeholder">
                    <p>Failed to load image</p>
                    <p>{image.url}</p>
                  </div>
                ) : (
                  <div className="image-container">
                    {loadingImages.has(image.url) && (
                      <div className="image-placeholder">Loading...</div>
                    )}
                    <img
                      src={image.url}
                      alt={`${image.field}: ${image.filename}`}
                      onLoad={() => handleImageLoad(image.url)}
                      onError={() => handleImageError(image.url)}
                      onLoadStart={() => handleImageLoadStart(image.url)}
                      style={{
                        display: loadingImages.has(image.url) ? 'none' : 'block'
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageBrowser;