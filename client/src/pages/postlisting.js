import React, { useState } from 'react';
import "./postlisting.css";

const Photo = ({ photoUrl, username, caption }) => {
  const [isLiked, setIsLiked] = useState(false); // Track like state
  const [commentCount, setCommentCount] = useState(0); // Track comment count

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleComment = () => {
    // Handle clicking comment icon, e.g., open comment modal
    setCommentCount(commentCount + 1); // Update comment count
  };

  return (
    <div className="photo-container">
      <img src={photoUrl} alt={caption} />
      <div className="photo-info">
        <p>{username}</p>
        <p>{caption}</p>
      </div>
      <div className="photo-actions">
        <button onClick={handleLike}>
          {isLiked ? 'Liked' : 'Like'}
        </button>
        <button onClick={handleComment}>
          {commentCount} Comments
        </button>
      </div>
    </div>
  );
};

const PhotoList = ({ photos }) => {
  return (
    <div className="photo-list">
      {photos.map((photo) => (
        <Photo key={photo.id} {...photo} />
      ))}
    </div>
  );
};

const App = () => {
  const photos = [
    {
      id: 1,
      photoUrl: 'https://picsum.photos/id/237/200/300',
      username: 'user1',
      caption: 'Beautiful sunset!',
    },
    // Add more photos here
  ];

  return (
    <PhotoList photos={photos} />
  );
};

export default App;
