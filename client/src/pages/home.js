import React from 'react';
import "./home.css";

import ChatListing from './chat-listing';
import Posts from "./postlisting";

function Home() {
    React.useEffect(() => {
        fetch('/api/data')
            .then(response => {
                console.log('Response:', response);
                return response.json();
            })
            .then(data => {
                console.log('Data:', data);
            })
            .catch(error => console.error('Error:', error));
    }, []);
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
