import { configureStore } from "@reduxjs/toolkit";
import notificationReducer from "./notification-reducer";


const store = configureStore({
    reducer:{
        notification: notificationReducer
    }
})
export default store;