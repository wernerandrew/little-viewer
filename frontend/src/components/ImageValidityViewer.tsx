import React from 'react';

interface ImageValidityDocument {
  _id: string;
  canonical_product_id: string;
  sorted_images: any[];
  image_validity: any;
  [key: string]: any;
}

interface ImageValidityViewerProps {
  documents: ImageValidityDocument[];
  selectedDocument: ImageValidityDocument | null;
  onDocumentSelect: (document: ImageValidityDocument) => void;
}

const ImageValidityViewer: React.FC<ImageValidityViewerProps> = ({
  documents,
  selectedDocument,
  onDocumentSelect,
}) => {
  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    if (selectedId) {
      const document = documents.find(doc => doc._id === selectedId);
      if (document) {
        onDocumentSelect(document);
      }
    }
  };

  return (
    <div className="image-validity-viewer">
      <div className="dropdown-section">
        <label htmlFor="document-selector">Select a document:</label>
        <select
          id="document-selector"
          value={selectedDocument?._id || ''}
          onChange={handleDropdownChange}
          className="document-dropdown"
        >
          <option value="">-- Select a document --</option>
          {documents.map((doc) => (
            <option key={doc._id} value={doc._id}>
              {doc.canonical_product_id} (ID: {doc._id})
            </option>
          ))}
        </select>
      </div>

      {selectedDocument && (
        <div className="document-details">
          <h2>Selected Document</h2>
          <div className="product-id-display">
            <h3>Canonical Product ID:</h3>
            <p className="product-id">{selectedDocument.canonical_product_id}</p>
          </div>
          
          {selectedDocument.sorted_images && selectedDocument.sorted_images.length > 0 && (
            <div className="images-section">
              <h3>Images ({selectedDocument.sorted_images.length})</h3>
              <div className="images-list">
                {selectedDocument.sorted_images.map((s3Key: string, index: number) => {
                  // Get validity for this image using S3 key as index
                  const isValid = selectedDocument.image_validity && 
                                 selectedDocument.image_validity[s3Key] === true;
                  const isInvalid = selectedDocument.image_validity && 
                                   selectedDocument.image_validity[s3Key] === false;
                  
                  return (
                    <div key={index} className="image-item">
                      <div className="image-header">
                        <div className="image-info">
                          <span className="image-number">#{index + 1}</span>
                          {isValid && <span className="validity-indicator valid">✓</span>}
                          {isInvalid && <span className="validity-indicator invalid">✗</span>}
                        </div>
                        <span className="image-key">{s3Key}</span>
                      </div>
                    <div className="image-container">
                      <img
                        src={`http://localhost:8000/api/image/${s3Key}`}
                        alt={`Image ${index + 1}: ${s3Key}`}
                        className="sorted-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'image-error';
                            errorDiv.textContent = 'Failed to load image';
                            parent.appendChild(errorDiv);
                          }
                        }}
                      />
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {documents.length === 0 && (
        <div className="no-documents">
          <p>No documents available. Make sure the MongoDB collection contains data.</p>
        </div>
      )}
    </div>
  );
};

export default ImageValidityViewer;