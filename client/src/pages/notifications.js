import "./notification.css"
import React, { useEffect } from 'react';
import axios from 'axios';
import { useCurrentUser } from '../functions';
import { useNavigate, useLocation } from "react-router-dom";
import Requests from "../components/requests";
import { useDispatch, useSelector } from 'react-redux';

import io from 'socket.io-client';


const Notification = ({ notification, index, requestedUsers }) => {
    const [friendReq, setFriendReq] = React.useState([])
    const current = useCurrentUser()
    const navigate = useNavigate()
    const handleNavigation = React.useCallback(() => {
        if (notification.type === "friend-request") {
            navigate(`/profile/${notification.senderId}`)
        }
    }, [])

    React.useEffect(() => {
        if (notification.type === 'friend-request') {
            const result = requestedUsers.filter((item) => {
                return item._id === notification.senderId
            })
            setFriendReq(result)
        }
    }, [requestedUsers, notification])




    return (
        <div className="each-notification" key={index} style={{ background: notification.readInfo ? "white" : "rgb(228, 228, 228)" }}>
            <div className="notification-details-section">
                <div style={{ flex: 1 }}>
                    <img onClick={() => { handleNavigation() }} style={{ width: 30, height: 30 }} src={'https://i.pinimg.com/736x/dc/3d/ef/dc3defd9307e2fda14dc377691be1c62.jpg'} alt={"dp"} className="profile-pic" />
                </div>
                <div style={{ flex: 6 }}>
                    <p onClick={() => { handleNavigation() }}><b>{notification.senderName}</b>{" "}{notification.message}</p>
                </div>
            </div>
            {notification.type === "friend-request" && (
                friendReq.map((user) => {
                    return (
                        <div style={{ display: "block" }}>
                            <Requests user={user} currentUser={current?.user?._id} fromNotification={true} />
                        </div>
                    )
                })
            )}
        </div>
    )
}


function NotificationLists() {

    const current = useCurrentUser()
    const [requestedUsers, setRequestedUsers] = React.useState([])

    const getRequests = React.useCallback(async () => {
        try {
            await axios.get(`/api/get-reqs/${current?.user?._id}`).then((res) => {
                setRequestedUsers(res.data)
            });
        } catch (error) {
            console.error('Error', error.message);
        }
    }, [current]);


    const notifications = useSelector((state) => {
        return state.notification.data
    })

    const unreadedIds = React.useMemo(() => {
        if (notifications.length > 0) {
            const unreadedNotifications = notifications.filter((n) => {
                return n.readInfo === false
            })

            const ids = unreadedNotifications.map((n) => {
                return n.notificationId
            })
            return ids
        }
    }, [notifications])


    const handleUpdateReadData = React.useCallback(async () => {
        try {
            await axios.post('/api/update-read-data', {
                unreadedIds
            }).then((res) => {
            });
        } catch (error) {
            console.error('Error', error.message);
        }
    }, [unreadedIds]);

    React.useEffect(() => {
        if (current?.user?._id) {
            getRequests()
        }
    }, [current,notifications])

    React.useEffect(() => {
        if (unreadedIds?.length > 0) {
            handleUpdateReadData()
        }
    }, [unreadedIds])

    return (
        <div className="navigation-wrapper">
            {/* <button onClick={click}>Click me</button> */}
            {notifications.map((notification, index) => {
                return (
                    <Notification notification={notification} index={index} requestedUsers={requestedUsers} />
                )
            })}
        </div>
    );
}
export default NotificationLists
