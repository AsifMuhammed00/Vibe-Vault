import React, { useState, useCallback } from 'react';
import './../pages/search-result.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const Requests = ({ user, currentUser, fromNotification }) => {

    const [isAccepted, setIsAccepted] = React.useState(false)
    const [isRejected, setIsRejected] = React.useState(false)

  const socket = io.connect('http://localhost:3001');

    const handleReqAccept = useCallback(async () => {
        setIsAccepted(true)
        try {
            socket.emit('accept-req', {
                userId: user._id,
                requestedUserId: currentUser,
            });
        } catch (error) {
            setIsAccepted(false)
            console.error('Error', error.message);
        }
    }, [currentUser]);

    const handleReqReject = useCallback(async () => {
        setIsRejected(true)
        try {
            await await axios.post('/api/reject-req', {
                userId: user._id,
                requestedUserId: currentUser,
            }).then((res) => {

            });
        } catch (error) {
            setIsRejected(false)
            console.error('Error', error.message);
        }
    }, [currentUser]);

    return (
        <div key={user._id} className="user-card" style={{width: Boolean(fromNotification) ? "unset" : undefined}}>
            <img src={'https://i.pinimg.com/736x/dc/3d/ef/dc3defd9307e2fda14dc377691be1c62.jpg'} style={{display: Boolean(fromNotification) ? "none" :undefined}} alt={user.name} className="profile-pic" />
            <div className="user-info">
                <Link to={`/profile/${user._id}`} style={{display: Boolean(fromNotification) ? "none" : undefined}}><span className="profile-name">{user.name}</span></Link>
                <div>
                    {!isRejected && (
                        <button
                            className="request-button"
                            onClick={handleReqAccept}
                            disabled={isAccepted}
                        >
                            {isAccepted ? "Accepted" : "Accept"}
                        </button>
                    )}
                    {!isAccepted &&(
                        <button
                        style={{ marginLeft: 10 }}
                        className="request-button"
                        onClick={handleReqReject}
                        disabled={isRejected}
                    >
                        {isRejected? "Rejected": "Reject"}
                    </button>
                    )}
                    
                </div>
            </div>
        </div>
    )
}

export default Requests;
