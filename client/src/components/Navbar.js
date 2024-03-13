// Header.js
import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import "./navbar.css"
import axios from 'axios';
import { useCurrentUser } from '../functions';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { getNotifications } from '../redux-toolkit/notification-reducer';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = React.useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = React.useState()


  const navigate = useNavigate();
  const current = useCurrentUser();
  const dispatch =useDispatch()

  const socket = io('http://localhost:3001');
  const userId = current?.user?._id

  socket.emit("connected", userId)

  const getSearchResults = useCallback(async () => {
    if (searchTerm) {
      try {
        await axios.get(`/api/search/${searchTerm}`).then((res) => {
          setUsers(res.data);
          if (res.data.length > 0) {
            setIsOpen(true)
          }
        });
      } catch (error) {
        console.error('Error fetching results', error.message);
      }
    }
  }, [searchTerm]);


  React.useEffect(() => {
    getSearchResults()
  }, [searchTerm])



  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    if (event.key === 'Enter' && event.target.value) {
      setIsOpen(false)
      navigate(`/search?key=${searchTerm}`)
    }
  };

  const notifications = useSelector((state) => {
    return state.notification.data
})

  React.useEffect(() => {
    if (notifications.length > 0) {
      const unreadedNotifications = notifications.filter((n) => {
        return n.readInfo === false
      })

     setUnreadNotificationCount(unreadedNotifications.length)
    } else{
      setUnreadNotificationCount(0)
    }
  }, [notifications])

  React.useEffect(()=>{
    dispatch(getNotifications())
  },[dispatch])

    socket.on("notifications", function (data) {
      dispatch(getNotifications())
    })
  return (
    <header className="app-header">
      <div className="header-left">
        {unreadNotificationCount > 0 && (
          <span className="badge">{unreadNotificationCount}</span>
        )}
        <i className="material-icons"><Link to={'/?notification'}>Notifications</Link></i>
        <span className="badge">2</span>
        <i className="material-icons"><Link to={'/?chat'}>Chat</Link></i>
      </div>
      <div className="header-center">
        {/* {value && ( */}
        <div className="profile-dropdown">
          <input
            className="profile-search-input"
            type="text"
            placeholder="Search"
            onFocus={() => { setIsOpen(true) }}
            onKeyPress={(e) => { handleSearchChange(e) }}
            // onBlur={() => { setIsOpen(false) }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {isOpen && searchTerm ? (
            <div className="dropdown-content">
              {users.map(user => (
                <button key={user._id} onClick={() => { navigate(`/profile/${user._id}`) }} className="user-item">
                  <img
                    className="profile-picture"
                    src={"https://i.pinimg.com/736x/dc/3d/ef/dc3defd9307e2fda14dc377691be1c62.jpg"}
                    alt="Profile Picture"
                  />
                  <span className="user-name">{user.name} {" "}{current?.user?._id === user._id ? "(You)" : null}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {/* )} */}
      </div>
      <div className="header-right">
        <i className="material-icons">mail</i>
      </div>
    </header>
  )
}

export default Header;
