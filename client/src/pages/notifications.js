import "./notification.css"
import React from 'react';
import axios from 'axios';
import { useCurrentUser } from '../functions';
import { useNavigate } from "react-router-dom";
import Requests from "../components/requests";

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
        <div className="each-notification" key={index}>
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
                        <div style={{display:"block"}}>
                            <Requests user={user} currentUser={current?.user?._id} fromNotification={true}/>
                        </div>
                    )
                })
            )}
        </div>
    )
}


function NotificationLists() {

    const current = useCurrentUser()
    const userId = current?.user?._id;
    const [notifications, setNotifications] = React.useState([])
    const [requestedUsers, setRequestedUsers] = React.useState([])

    const fetchNotifications = React.useCallback(async () => {
        if (userId) {
            try {
                await axios.get(`/api/get-recent-notifications/${userId}`).then((res) => {
                    setNotifications(res.data)
                });
            } catch (error) {
                console.error('Error fetching notifications', error.message);
            }
        }
    }, [userId]);


    const getRequests = React.useCallback(async () => {
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

    React.useEffect(() => {
        fetchNotifications()
    }, [userId])

    console.log("requestedUsers", requestedUsers)

    return (
        <div className="navigation-wrapper">
            {notifications.map((notification, index) => {
                return (
                    <Notification notification={notification} index={index} requestedUsers={requestedUsers} />
                )
            })}
        </div>
    );
}
export default NotificationLists
