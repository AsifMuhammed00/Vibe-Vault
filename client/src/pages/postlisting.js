import React, { useState } from 'react';
import "./postlisting.css";

const Photo = ({ photoUrl, username, caption,id }) => {

  return (
      <div key={id} className="post">
        <img src={photoUrl} alt="Post" className="post-image" />
        <p className="post-caption">{caption}</p>
        <div className="post-actions">
          <span>Likes: {44}</span>
          <button className="like-button">Like</button>
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
    { id: 1, username:"Asif",photoUrl: "https://html.com/wp-content/uploads/very-large-flamingo.jpg", caption: 'A Flamboyance of Flamingos: Basking in the Golden Glow of Sunset, Their Pink Plumage Paints a Picturesque Scene Against the Azure Sky.', likes: 10, comments: [] },
    // Add more photos here
  ];

  

  return (
    <PhotoList photos={photos} />
  );
};

export default App;
