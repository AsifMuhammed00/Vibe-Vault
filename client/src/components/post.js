
import React, { useState, useCallback, useEffect } from 'react';
import './../pages/user-profile.css';
import axios from 'axios';
import Moment from 'react-moment';
import moment from 'moment';
import { useCurrentUser } from '../functions';
import { Link } from 'react-router-dom';

const Post = ({ post, userId, userName, fetchPostsByUserId, fetchPosts, fromHome }) => {
  const [isLike, setIsLike] = useState(false)
  const [postInfo, setPostInfo] = useState()
  const current = useCurrentUser()

  const deletePost = useCallback(async () => {
    try {
      await axios.delete(`/api/posts/${userId}/${post._id}`);
      if (Boolean(fromHome) === false) {
        fetchPostsByUserId(userId);
      } else{
        fetchPosts()
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }, [fetchPostsByUserId, post, fetchPosts]);

  const getPostInfo = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/get-post-info/${post._id}`, {
      });

      setPostInfo(response.data.postInfo)
    } catch (error) {
      console.error(error.message);
    }
  }, [post, postInfo]);


  const handleLikeUnlike = useCallback(async () => {
    setIsLike(!isLike)
    try {
      await axios.post('http://localhost:3001/api/like-unlike', {
        userId: current?.user?._id,
        postId: post._id,
        isLike,
        postOwnerId : post.userId,
        userName
      });
      getPostInfo()
    } catch (error) {
      console.error(error.message);
    }
  }, [post, userId, isLike]);

  React.useEffect(() => {
    getPostInfo()
  }, [])


  React.useEffect(() => {
    const isLikedPost = postInfo?.likes.find((p) => {
      return p === current?.user?._id
    })
    setIsLike(Boolean(isLikedPost))
  }, [postInfo])

  return (
    <div className="post" key={post._id}>
      <div style={{ display: "flex", justifyContent: 'space-between' }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {fromHome && (
            <div style={{display:"flex",alignItems:"center"}}>
              <img style={{width:40,height:40}} src={'https://i.pinimg.com/736x/dc/3d/ef/dc3defd9307e2fda14dc377691be1c62.jpg'} alt="profile" className="profile-pic" />
              <Link to={`/profile/${post.userId}`}><h3 style={{ margin: "unset" }}>{post.postOwnerName}</h3></Link>
            </div>
          )}
          <p style={{ color: "#c3c3c3", margin: "unset" }}>
            <Moment fromNow>{moment(post.createdAt)}</Moment>
          </p>
        </div>
        {post.userId === current?.user?._id ? (
          <button onClick={deletePost}>Delete</button>
        ) : null}
      </div>
      <p
        className="post-caption"
        dangerouslySetInnerHTML={{ __html: post.postContent.replace(/\n/g, "<br />") }}
      />
      <img src={"https://img.photographyblog.com/reviews/kodak_pixpro_fz201/photos/kodak_pixpro_fz201_01.jpg"} alt="Post" className="post-image" />
      <div className="post-actions">
        <span>Likes: {postInfo?.likes.length}</span>
        <button className="like-button" onClick={handleLikeUnlike}>{isLike ? "Liked" : "Like"}</button>
      </div>
    </div>
  );
};

export default Post;
