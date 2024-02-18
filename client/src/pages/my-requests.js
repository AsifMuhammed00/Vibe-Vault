import React, { useState, useCallback } from 'react';
import './search-result.css';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../functions';
import Requests from '../components/requests';

const MyRequests = ({ }) => {

    const [requestedUsers, setRequestedUsers] = React.useState([])
    const current = useCurrentUser()

    const getRequests = useCallback(async () => {
        try {
            await axios.get(`/api/get-reqs/${current?.user?._id}`).then((res) => {
                setRequestedUsers(res.data)
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
