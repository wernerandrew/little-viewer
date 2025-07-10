import React from 'react';

interface CollectionListProps {
  collections: string[];
  onCollectionSelect: (collectionName: string) => void;
}

const CollectionList: React.FC<CollectionListProps> = ({ collections, onCollectionSelect }) => {
  if (collections.length === 0) {
    return (
      <div className="no-collections">
        <p>No collections found. Make sure MongoDB is running and contains data.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Collections</h2>
      <div className="collection-list">
        {collections.map((collection) => (
          <div
            key={collection}
            className="collection-item"
            onClick={() => onCollectionSelect(collection)}
          >
            <h3>{collection}</h3>
            <p>Click to browse documents</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionList;