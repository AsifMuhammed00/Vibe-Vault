import "./contactlist.css"
import React from 'react';
import axios from 'axios';
import { useCurrentUser } from '../functions';

function NotificationLists() {

    const current = useCurrentUser()
    const userId = current?.user?._id;

    const fetchNotifications = React.useCallback(async () => {
        if (userId) {
            try {
                await axios.get(`/api/get-recent-notifications/${userId}`).then((res) => {
                    console.log("reds",res.data)
                });
            } catch (error) {
                console.error('Error fetching notifications', error.message);
            }
        }
    }, [userId]);

    React.useEffect(() => {
        fetchNotifications()
    }, [userId])

    return (
        <div>
            Hello world
        </div>
    );
}
export default NotificationLists
