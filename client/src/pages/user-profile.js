// ProfilePage.js

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import './user-profile.css';
import { useCurrentUser } from '../functions/index';
import axios from 'axios';
import Moment from 'react-moment';
import moment from 'moment';
import Post from "../components/post"
import { io } from 'socket.io-client';

const ProfilePage = () => {
  const [posts, setPosts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatePostLoading, setIsCreatePostLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [userInfo, setUserInfo] = useState();
  const [requestedUsers, setRequestedUsers] = React.useState([])
  const [incomingRequests, setIncomingRequests] = React.useState([])
  const [isReqSent, setIsReqSent] = React.useState(false)
  const [isRequestedUser, setRequestedUser] = React.useState(false)

  const [isAccepted, setIsAccepted] = React.useState(false)
  const [isAlreadyFriend, setIsAlreadyFriend] = React.useState(false)
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [customImageName, setCustomImageName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  const current = useCurrentUser();
  const { id } = useParams();
  const socket = io.connect('http://localhost:3001');


  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const currentUserId = current?.user?._id
  const userId = React.useMemo(() => {
    if (id) {
      return id;
    } else {
      return currentUserId
    }
  }, [currentUserId, id])

  const getRequests = useCallback(async () => {
    try {
      await axios.get(`/api/find-reqs/${currentUserId}`).then((res) => {
        setRequestedUsers(res.data)
      });
    } catch (error) {
      console.error('Error', error.message);
    }
  }, [currentUserId]);

  const getIncomingRequests = useCallback(async () => {
    try {
      await axios.get(`/api/get-reqs/${currentUserId}`).then((res) => {
        const requestedIds = res.data.map((user) => user._id)
        setIncomingRequests(requestedIds)
      });
    } catch (error) {
      console.error('Error', error.message);
    }
  }, [currentUserId]);

  const handleReqAccept = useCallback(async () => {
    setIsAccepted(true)
    try {
      socket.emit('accept-req', {
        userId,
        requestedUserId: currentUserId,
      });
    } catch (error) {
      setIsAccepted(false)
      console.error('Error', error.message);
    }
  }, [userId]);

  // const handleSendRequest = useCallback(async () => {
  //   setIsReqSent(true)
  //   try {
  //     await axios.post('/api/send-req', {
  //       to: userId,
  //       from: currentUserId,
  //       status: "Requested"
  //     }).then((res) => {
  //       socket.emit('join', {recipientId : userId});

  //     });
  //   } catch (error) {
  //     setIsReqSent(false)
  //     console.error('Error', error.message);
  //   }
  // }, [currentUserId,userId]);

  const handleSendRequest = useCallback(async () => {
    setIsReqSent(true);
    try {
      socket.emit('sendReq', {
        to: userId,
        from: currentUserId,
        status: "Requested"
      });
    } catch (error) {
      setIsReqSent(false);
      console.error('Error', error.message);
    }
  }, [currentUserId, userId]);

  const cancelRequest = useCallback(async () => {
    setIsReqSent(false)
    try {
      socket.emit('cancel-req', {
        userId,
        requestedUserId: currentUserId
      });
    } catch (error) {
      console.error('Error', error.message);
      setIsReqSent(true)
    }
  }, [currentUserId]);

  React.useEffect(() => {
    const alreadyRequested = requestedUsers.find((u) => {
      return u === userId
    })
    if (Boolean(alreadyRequested)) {
      setIsReqSent(true)
    }
    const incomingRequested = incomingRequests.find((u) => {
      return u === userId
    })
    if (Boolean(incomingRequested)) {
      setRequestedUser(true)
    }
  }, [requestedUsers, incomingRequests, current, userId])

  React.useEffect(() => {
    setIsAlreadyFriend(false)
    const isFriend = current?.user?.friends?.find((u) => {
      return u === userId
    })

    if (Boolean(isFriend)) {
      setIsAlreadyFriend(true)
    }
  }, [current?.user?.friends, userId])

  const fetchPostsByUserId = useCallback(async () => {
    if (userId) {
      try {
        await axios.get(`/api/posts/${userId}`).then((res) => {
          setPosts(res.data);

        });
      } catch (error) {
        console.error('Error fetching posts', error.message);
      }
    }
  }, [userId]);

  const getUserDetails = useCallback(async () => {
    if (userId) {
      try {
        await axios.get(`/api/get-user-info/${userId}`).then((res) => {
          setUserInfo(res.data);
        });
      } catch (error) {
        console.error('Error fetching posts', error.message);
      }
    }
  }, [userId]);

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('customImageName', customImageName); 
      formData.append('image', selectedFile);
  
      try {
        const res = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      console.log('No file selected');
    }
  };
  

  const handlePostSubmit = useCallback(async () => {
    setIsCreatePostLoading(true);
    try {
      await axios.post('http://localhost:3001/api/create-new-post', {
        userId,
        postContent,
        postImage: customImageName
      }).then(async () => {
        if(selectedFile){
        await handleUpload();
        }
        await fetchPostsByUserId();
        setIsCreatePostLoading(false);
        setPostContent('')
        setIsOpen(false);
      });
    } catch (error) {
      console.error('Error creating post', error.message);
      setIsCreatePostLoading(false);
    }
  }, [postContent, userId, selectedFile, customImageName]);
  


  useEffect(() => {
    getUserDetails()
    fetchPostsByUserId();
    getRequests()
    getIncomingRequests()
  }, [userId]);

  const handleFileChange = (e) => {
    const file = moment().valueOf()
    setSelectedFile(e.target.files[0]);
    setCustomImageName(`img-${userId+file}.jpg`);
  };

const handleUpdateprofilePicture = async()=>{
  try {
    await axios.post('/api/update-profile-picture', {
        userId: currentUserId,
        fileName: customImageName,
    })
} catch (error) {
    console.error('Error', error.message);
}
}

const handleImageUpload = useCallback(async(event) => {
  const file = event.target.files[0];

  if (!file) return;

  const filename = `profile-${currentUserId}-${moment().valueOf()}.jpg`;
  console.log("filename",filename)

  if (file) {
    const formData = new FormData();
    formData.append('customImageName', filename); 
    formData.append('image', file);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }

    try {
      await axios.post('/api/update-profile-picture', {
          userId: currentUserId,
          fileName:filename,
      })
  } catch (error) {
      console.error('Error', error.message);
  }
  } else {
    console.log('No file selected');
  }

  const reader = new FileReader();
  
  reader.onloadend = () => {
    setSelectedImage(reader.result);
  };

  reader.readAsDataURL(file);

}, [userId,currentUserId]); 


  
  const handleImageClick = () => {
    document.getElementById('fileInput').click();
  };

  console.log("selected",selectedFile)

  const imageUrl = selectedImage || `/api/images/${userInfo?.profilePicture}`  ;

  return (
    <div className="profile-page">
      <div className="profile-header">
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
        <img src={imageUrl} alt="Profile" onClick={userId === currentUserId ? handleImageClick : undefined} className="profile-picture" />
        <div className="about-section">
          <h2>{userInfo?.name}  {currentUserId === userInfo?._id ? "(You)" : null}</h2>
          <p>Your bio or about information</p>
        </div>
        <div>
          {isAlreadyFriend ? (
            <h4>Friend</h4>
          ) : (
            isRequestedUser ? (
              <button
                className="request-button"
                disabled={isAccepted}
                onClick={() => { handleReqAccept() }}
              >
                {isAccepted ? "Accepted" : "Accept Request"}
              </button>
            ) : (
              userId !== currentUserId && (
                <button
                  className="request-button"
                  onClick={() => { isReqSent ? cancelRequest() : handleSendRequest(); }}
                >
                  {isReqSent ? "Cancel Request" : "Request"}
                </button>
              )
            )
          )}
        </div>
      </div>

      <div className="create-post">
        {!isOpen && currentUserId === userInfo?._id ? (
          <button onClick={handleOpen}>Create Post</button>
        ) : null}
        {isOpen && (
          <div className="modal">
            <textarea
              name="text"
              value={postContent}
              onChange={(e) => { setPostContent(e.target.value) }}
              placeholder="Write your post here..."
            />
             <input type="file" onChange={handleFileChange}/>
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
        <h2>{currentUserId === userInfo?._id ? "My Posts" : "Posts"}</h2>
        {posts.map(post => {
          return (
            <Post key={post.id} post={post} userId={currentUserId} userName={current?.user?.name} fetchPostsByUserId={fetchPostsByUserId} />
          )
        })}
      </div>
    </div>
  );
};

export default ProfilePage;
