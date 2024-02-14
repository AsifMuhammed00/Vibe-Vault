// ProfilePage.js

import React, { useState, useCallback, useEffect } from 'react';
import './my-profile.css';
import { useCurrentUser } from './../functions/index';
import axios from 'axios';
import Moment from 'react-moment';
import moment from 'moment';

// Post component definition
const Post = ({ post,userId,fetchPostsByUserId }) => {
  const deletePost = useCallback(async () => {
    try {
      await axios.delete(`/api/posts/${userId}/${post._id}`);
      fetchPostsByUserId(userId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }, [fetchPostsByUserId,post]);
  return (
    <div className="post" key={post.id}>
      <div style={{display:"flex",justifyContent:'space-between'}}>
      <p style={{ color: "#c3c3c3" }}>
        <Moment fromNow>{moment(post.createdAt)}</Moment>
      </p> 
      {post.userId === userId ? (
      <button onClick={deletePost}>Delete</button>
      ):null}
      </div>
      <p
        className="post-caption"
        dangerouslySetInnerHTML={{ __html: post.postContent.replace(/\n/g, "<br />") }}
      />
      <img src={"https://img.photographyblog.com/reviews/kodak_pixpro_fz201/photos/kodak_pixpro_fz201_01.jpg"} alt="Post" className="post-image" />
      <div className="post-actions">
        <span>Likes: {post.likes.length}</span>
        <button className="like-button">Like</button>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [posts, setPosts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatePostLoading, setIsCreatePostLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const current = useCurrentUser();
  const userId = current.user?._id;

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handlePostSubmit = useCallback(async () => {
    setIsCreatePostLoading(true);
    setTimeout(async () => {
      try {
        await axios.post('http://localhost:3001/api/create-new-post', {
          userId,
          postContent
        }).then(() => {
          fetchPostsByUserId();
          setIsCreatePostLoading(false);
          setIsOpen(false);
        });
      } catch (error) {
        console.error('Error creating post', error.message);
        setIsCreatePostLoading(false);
      }
    }, 6000);
  }, [postContent, userId]);

  const fetchPostsByUserId = useCallback(() => {
    axios.get(`/api/posts/${userId}`)
      .then(response => {
        setPosts(response.data); 
      })
      .catch(error => {
        console.error('Error fetching posts', error.message);
      });
  }, [userId]);

  useEffect(() => {
    fetchPostsByUserId();
  }, [fetchPostsByUserId]);

  return (
    <div className="profile-page">
      {/* Profile header */}
      <div className="profile-header">
        <img src="url_to_your_profile_picture" alt="Profile" className="profile-picture" />
        <div className="about-section">
          <h2>{current?.user?.name}</h2>
          <p>Your bio or about information</p>
        </div>
      </div>

      {/* Create post section */}
      <div className="create-post">
        {!isOpen && (
          <button onClick={handleOpen}>Create Post</button>
        )}
        {isOpen && (
          <div className="modal">
            <textarea
              name="text"
              value={postContent}
              onChange={(e)=>{setPostContent(e.target.value)}}
              placeholder="Write your post here..."
            />
            <div className="buttons">
              <button style={{ marginRight: 20 }} onClick={handlePostSubmit} disabled={isCreatePostLoading}>
                {isCreatePostLoading ? "Posting..." : "Post"}
              </button>
              <button onClick={handleClose}>Close</button>
            </div>
          </div>
        )}
      </div>

      {/* My posts section */}
      <div className="my-posts-section">
        <h2>My Posts</h2>
        {posts.map(post => (
          <Post key={post.id} post={post} userId={userId} fetchPostsByUserId={fetchPostsByUserId} />
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
