// ProfilePage.js

import React, { useState } from 'react';
import './my-profile.css';

const ProfilePage = () => {
  const [posts, setPosts] = useState([
    { id: 1, photoUrl: "https://html.com/wp-content/uploads/very-large-flamingo.jpg", caption: 'A Flamboyance of Flamingos: Basking in the Golden Glow of Sunset, Their Pink Plumage Paints a Picturesque Scene Against the Azure Sky.', likes: 10, comments: [] },
    // Add more posts as needed
  ]);

  return (
    <div className="profile-page">
      <div className="profile-header">
        {/* Display profile picture */}
        <img src="url_to_your_profile_picture" alt="Profile" className="profile-picture" />
        {/* About section */}
        <div className="about-section">
          <h2>About Me</h2>
          <p>Your bio or about information</p>
        </div>
      </div>

      {/* My posts section */}
      <div className="my-posts-section">
        <h2>My Posts</h2>
        {posts.map(post => (
          <div key={post.id} className="post">
            <img src={post.photoUrl} alt="Post" className="post-image" />
            <p className="post-caption">{post.caption}</p>
            <div className="post-actions">
              <span>Likes: {post.likes}</span>
              {/* Add like button */}
              <button className="like-button">Like</button>
              {/* Add comment section */}
              <div className="comment-section">
                {/* Display comments */}
                {post.comments.map((comment, index) => (
                  <div key={index} className="comment">{comment}</div>
                ))}
                {/* Add comment input */}
                <input type="text" placeholder="Add a comment..." className="comment-input" />
                <button className="comment-button">Comment</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
