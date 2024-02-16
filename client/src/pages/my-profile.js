// ProfilePage.js

import React, { useState, useCallback, useEffect } from 'react';
import './my-profile.css';
import { useCurrentUser } from './../functions/index';
import axios from 'axios';
import Moment from 'react-moment';
import moment from 'moment';
import Post from "../components/post"

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


  const fetchPostsByUserId = useCallback(async () => {
    if(userId){
    try {
       await axios.get(`/api/posts/${userId}`).then((res)=>{
      setPosts(res.data); 

       });
    } catch (error) {
      console.error('Error fetching posts', error.message);
    }
  }
  }, [userId]); 

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

  
  useEffect(() => {
    fetchPostsByUserId();
  }, [userId]); 

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img src="url_to_your_profile_picture" alt="Profile" className="profile-picture" />
        <div className="about-section">
          <h2>{current?.user?.name}</h2>
          <p>Your bio or about information</p>
        </div>
      </div>

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

      <div className="my-posts-section">
        <h2>My Posts</h2>
        {posts.map(post => {
          return(
            <Post key={post.id} post={post} userId={userId} userName={current?.user.name} fetchPostsByUserId={fetchPostsByUserId} />
          )
          })}
      </div>
    </div>
  );
};

export default ProfilePage;
