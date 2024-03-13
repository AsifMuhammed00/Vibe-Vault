import React from 'react';
import "./home.css";
import axios from 'axios';

import ChatListing from './chat-listing';
import Posts from "./postlisting";
import Post from '../components/post';
import { useCurrentUser } from '../functions';
import NotificationLists from './notifications';
import { useLocation } from 'react-router-dom';

function Home() {

    const [posts, setPosts] = React.useState([])


    const current = useCurrentUser()
    const userId = current?.user?._id;
    const location = useLocation();

    const fetchPosts = React.useCallback(async () => {
        if (userId) {
            try {
                await axios.get(`/api/get-recent-posts/${userId}`).then((res) => {
                    setPosts(res.data);

                });
            } catch (error) {
                console.error('Error fetching posts', error.message);
            }
        }
    }, [userId]);

    React.useEffect(() => {
        fetchPosts();
    }, [userId])


    return (
        <div className="home-content-wrapper">
            {location.search === "?notification" ? (
                <div className="chat-notification-area">
                    {}
                    <NotificationLists />
                </div>
            ) : location.search === "?chat" ? (<div className="chat-notification-area">
                <ChatListing />
            </div>) : null
            }
            <div className='posts-area' style={{ marginLeft: location.search === "?notification" || location.search === "?chat" ? 300 : undefined }}>
                {posts.map((post, index) => {
                    return (
                        <Post key={post._id} post={post} userId={userId} userName={current?.user?.name} fetchPosts={fetchPosts} fromHome={true} />
                    )
                })}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 50 }}><h2>No more posts</h2></div>
            </div>
        </div>
    );
}

export default Home;
