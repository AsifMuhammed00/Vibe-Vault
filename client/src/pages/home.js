import React from 'react';
import "./home.css";

import ChatListing from './chat-listing';
import Posts from "./postlisting";

function Home() {
    return (
        <div className="home-content-wrapper">
            <div className="chat-notification-area">
                <ChatListing />
            </div>
            <div className='posts-area'>
                <Posts />
            </div>
        </div>
    );
}

export default Home;
