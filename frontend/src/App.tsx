import React, { useState, useEffect } from 'react';
import ImageValidityViewer from './components/ImageValidityViewer';
import './App.css';

interface ImageValidityDocument {
  _id: string;
  canonical_product_id: string;
  sorted_images: any[];
  image_validity: any;
  [key: string]: any;
}

const App: React.FC = () => {
  const [documents, setDocuments] = useState<ImageValidityDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ImageValidityDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImageValidityDocuments();
  }, []);

  const fetchImageValidityDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/image-validity/random');
      if (!response.ok) throw new Error('Failed to fetch image validity documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (document: ImageValidityDocument) => {
    setSelectedDocument(document);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Image Reviewer</h1>
      </header>

      <main className="app-main">
        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading...</div>}

        <ImageValidityViewer
          documents={documents}
          selectedDocument={selectedDocument}
          onDocumentSelect={handleDocumentSelect}
        />
      </main>
    </div>
  );
};

export default App;