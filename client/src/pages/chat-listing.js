import React, { useCallback, useState } from "react";
import "./contactlist.css"
import { useCurrentUser } from "../functions";
import axios from "axios";
import Chat from "../components/chat";
import { io } from "socket.io-client";

function ContactList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = React.useState([])
  const [contacts, setContacts] = React.useState([])

  const [selectedUser, setSelectedUser] = React.useState()


  const current = useCurrentUser()
  const userId = current?.user?._id

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    if (event.key === 'Enter' && event.target.value) {
      setIsOpen(false)
    }
  };

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

  const getRecentChatProfiles = useCallback(async () => {
    if (userId) {
      try {
        await axios.get(`/api/get-recent-chat-profiles/${userId}`).then((res) => {
          setContacts(res.data);
        });
      } catch (error) {
        console.error('Error fetching profiles', error.message);
      }
    }
  }, [userId]);

  const socket = io('http://localhost:3001');

  React.useEffect(() => {
    getSearchResults()
  }, [searchTerm])

  React.useEffect(()=>{
    getRecentChatProfiles()
  },[userId,selectedUser])

  socket.emit("connectedd",userId)

  socket.on("recentChats", function (data) {
    setContacts(data.userDetailsArray);
})
  
  return (
    Boolean(selectedUser) ? (
      <Chat setSelectedUser={setSelectedUser} selectedUser={selectedUser} userId={userId}/>
    ) : (
      <div>
        <input
          style={{ marginBottom: 20 }}
          className="profile-search-input"
          type="text"
          placeholder="Search"
          onFocus={() => { setIsOpen(true) }}
          onKeyPress={(e) => { handleSearchChange(e) }}
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {isOpen && searchTerm ? (
          <div className="dropdown-content">
            {users.map(user => (
              <button key={user._id} className="user-item" onClick={() => { setSelectedUser(user._id) }}>
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
        <ul className="contact-list">
          {contacts.map((contact) => (
            <li key={contact._id} className="contact" onClick={()=>{setSelectedUser(contact._id)}}>
              <img src={"https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?cs=srgb&dl=pexels-anjana-c-674010.jpg&fm=jpg"} alt={contact.name} className="avatar" />
              <div className="info">
                <h2>{contact.name}</h2>
                <h2 className="last-message">{contact.lastMessage}</h2>
                <span className="status">NA</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  );
}
export default ContactList
