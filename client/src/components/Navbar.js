// Header.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import "./navbar.css"

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    {
      id: 1,
      name: 'John Doe',
      profileImageUrl: 'https://i.pinimg.com/736x/02/fc/93/02fc93a2bfc6c1cac3db1a678f1837b0.jpg'
    },
    {
      id: 2,
      name: 'Jane Smith',
      profileImageUrl: 'https://i.pinimg.com/736x/02/fc/93/02fc93a2bfc6c1cac3db1a678f1837b0.jpg'
    },
    {
      id: 3,
      name: 'Alice Johnson',
      profileImageUrl: 'https://i.pinimg.com/736x/02/fc/93/02fc93a2bfc6c1cac3db1a678f1837b0.jpg'
    },
    // Add more users as needed
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return(
  <header className="app-header">
    <div className="header-left">
      <i className="material-icons"><Link to={'/?notification'}>Notifications</Link></i>
      <span className="badge">2</span>
      <i className="material-icons"><Link to={'/?chat'}>Chat</Link></i>
    </div>
    <div className="header-center">
    <div className="profile-dropdown">
      <input
        className="profile-search-input"
        type="text"
        placeholder="Search"
        onFocus={()=>{setIsOpen(true)}}
        onBlur={()=>{setIsOpen(false)}}
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {isOpen && (
        <div className="dropdown-content">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-item">
              <img
                className="profile-picture"
                src={user.profileImageUrl}
                alt="Profile Picture"
              />
              <span className="user-name">{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
    <div className="header-right">
      <i className="material-icons">mail</i>
    </div>
  </header>
)}

export default Header;
