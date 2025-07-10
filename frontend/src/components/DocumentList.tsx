import React from 'react';

interface Document {
  _id: string;
  [key: string]: any;
}

interface DocumentListProps {
  collectionName: string;
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  collectionName, 
  documents, 
  onDocumentSelect 
}) => {
  const renderDocumentPreview = (document: Document) => {
    const entries = Object.entries(document).slice(0, 5);
    return (
      <div className="document-preview">
        {entries.map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong> {String(value).substring(0, 50)}
            {String(value).length > 50 && '...'}
          </div>
        ))}
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="no-documents">
        <h2>Documents in {collectionName}</h2>
        <p>No documents found in this collection.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Documents in {collectionName}</h2>
      <p>{documents.length} document(s) found</p>
      <div className="document-list">
        {documents.map((document) => (
          <div
            key={document._id}
            className="document-item"
            onClick={() => onDocumentSelect(document)}
          >
            <h4>ID: {document._id}</h4>
            {renderDocumentPreview(document)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;