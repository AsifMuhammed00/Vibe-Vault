import axios from 'axios';
import React from 'react';

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = React.useState({ isAuthenticated: false, user: null,loading:true });   

    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setCurrentUser({
                        isAuthenticated: false,
                        user: null,
                        loading: false
                    });
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
                    user: userData.user,
                    loading: false
                });
            } catch (error) {
                setCurrentUser({
                    isAuthenticated: false,
                    user: null,
                    loading: false
                });
            }
        };

        fetchUserData();
    }, []);

    return currentUser;
}