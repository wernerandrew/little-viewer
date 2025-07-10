import React, { useState, useEffect } from 'react';
import CollectionList from './components/CollectionList';
import DocumentList from './components/DocumentList';
import ImageBrowser from './components/ImageBrowser';
import './App.css';

interface Document {
  _id: string;
  [key: string]: any;
}

interface Image {
  field: string;
  url: string;
  filename: string;
}

const App: React.FC = () => {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchDocuments = async (collectionName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/collections/${collectionName}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents);
      setSelectedCollection(collectionName);
      setSelectedDocument(null);
      setImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (collectionName: string, documentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/collections/${collectionName}/documents/${documentId}/images`);
      if (!response.ok) throw new Error('Failed to fetch images');
      const data = await response.json();
      setImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSelect = (collectionName: string) => {
    fetchDocuments(collectionName);
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    if (selectedCollection) {
      fetchImages(selectedCollection, document._id);
    }
  };

  const handleBack = () => {
    if (selectedDocument) {
      setSelectedDocument(null);
      setImages([]);
    } else if (selectedCollection) {
      setSelectedCollection(null);
      setDocuments([]);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Image Reviewer</h1>
        {(selectedCollection || selectedDocument) && (
          <button onClick={handleBack} className="back-button">
            ← Back
          </button>
        )}
      </header>

      <main className="app-main">
        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading...</div>}

        {!selectedCollection && (
          <CollectionList
            collections={collections}
            onCollectionSelect={handleCollectionSelect}
          />
        )}

        {selectedCollection && !selectedDocument && (
          <DocumentList
            collectionName={selectedCollection}
            documents={documents}
            onDocumentSelect={handleDocumentSelect}
          />
        )}

        {selectedDocument && (
          <ImageBrowser
            document={selectedDocument}
            images={images}
          />
        )}
      </main>
    </div>
  );
};

export default App;