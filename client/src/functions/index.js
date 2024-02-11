import axios from 'axios';
import React from 'react';

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = React.useState({ isAuthenticated: false, user: null });   

    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    return; 
                }

                const response = await axios.get('http://localhost:3001/api/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const userData = response.data;
                setCurrentUser({
                    isAuthenticated: true,
                    user: userData.user
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Handle errors gracefully
            }
        };

        fetchUserData();
    }, []);

    return currentUser;
}