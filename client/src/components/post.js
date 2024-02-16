
import React, { useState, useCallback, useEffect } from 'react';
import './../pages/my-profile.css';
import { useCurrentUser } from './../functions/index';
import axios from 'axios';
import Moment from 'react-moment';
import moment from 'moment';

const Post = ({ post,userId,userName,fetchPostsByUserId }) => {
    const [isLike,setIsLike] = useState(false)
    const [postInfo,setPostInfo] = useState()
  
    const deletePost = useCallback(async () => {
      try {
        await axios.delete(`/api/posts/${userId}/${post._id}`);
        fetchPostsByUserId(userId);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }, [fetchPostsByUserId,post]);
  
    const getPostInfo = useCallback(async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/get-post-info/${post._id}`, {
          });
  
        console.log("response",response)
        setPostInfo(response.data.postInfo)
      } catch (error) {
        console.error(error.message);
      } 
    }, [post,postInfo]);
  
  
    const handleLikeUnlike = useCallback(async () => {
      setIsLike(!isLike)
      try {
        await axios.post('http://localhost:3001/api/like-unlike', {
          userId,
          postId: post._id,
          isLike,
          userName
        });
       getPostInfo()
      } catch (error) {
        console.error(error.message);
      } 
    }, [post, userId,isLike]);
  
    React.useEffect(()=>{
      getPostInfo()
    },[])
  
    
    React.useEffect(()=>{
      const isLikedPost = postInfo?.likes.find((p)=>{
        return p.userId === userId
      })
      setIsLike(Boolean(isLikedPost))
    },[postInfo])
  
    console.log("isLike",isLike)
    return (
      <div className="post" key={post._id}>
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
          <span>Likes: {postInfo?.likes.length}</span>
          <button className="like-button" onClick={handleLikeUnlike}>{isLike ? "Liked" : "Like"}</button>
        </div>
      </div>
    );
  };

export default Post;
