import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";


const fetchUserData = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
          return null
        }

        const response = await axios.get('http://localhost:3001/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        return response.data.user;

    } catch (error) {
        console.log(error)
    }
};



const user = await fetchUserData()

const getNotifications = createAsyncThunk('api/posts', () => {
    if (user) {
        return axios.get(`/api/get-recent-notifications/${user._id}`).then((res) => {
            return res.data
        })
    }
})

const notificationSlice = createSlice({
    name: 'notification',
    initialState: {
        data: [],
        error: "",
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getNotifications.pending, (state, action) => {
                state.loading = true;
            })
            .addCase(getNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Error";
            });
    },
});



export { getNotifications }

export default notificationSlice.reducer;