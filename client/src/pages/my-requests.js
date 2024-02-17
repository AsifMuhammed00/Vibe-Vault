import React, { useState, useCallback } from 'react';
import './search-result.css';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../functions';

const Requests = ({ user, currentUser }) => {

    const [isAccepted, setIsAccepted] = React.useState(false)
    const [isRejected, setIsRejected] = React.useState(false)


    const handleReqAccept = useCallback(async () => {
        setIsAccepted(true)
        try {
            await await axios.post('/api/accept-req', {
                userId: user._id,
                requestedUserId: currentUser,
            }).then((res) => {

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
        <div key={user._id} className="user-card">
            <img src={'https://i.pinimg.com/736x/dc/3d/ef/dc3defd9307e2fda14dc377691be1c62.jpg'} alt={user.name} className="profile-pic" />
            <div className="user-info">
                <Link to={`/profile/${user._id}`}><span className="profile-name">{user.name}</span></Link>
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


const MyRequests = ({ }) => {

    const [requestedUsers, setRequestedUsers] = React.useState([])
    const current = useCurrentUser()

    const getRequests = useCallback(async () => {
        try {
            await axios.get(`/api/get-reqs/${current?.user?._id}`).then((res) => {
                setRequestedUsers(res.data)
                console.log("requestedUsers", res.data)
            });
        } catch (error) {
            console.error('Error', error.message);
        }
    }, [current]);

    React.useEffect(() => {
        if (current?.user?._id) {
            getRequests()
        }
    }, [current])
    return (
        <div style={{ padding: 30 }}>
            <div className="search-results">
                <h2>Requests</h2>
                {requestedUsers.map((user) => {
                    return (
                        <Requests user={user} currentUser={current?.user?._id} />
                    )
                })}
            </div>
        </div>
    );
};

export default MyRequests;
