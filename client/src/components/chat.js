import React, { useEffect, useState } from 'react';
import './chat.css';
import { useCurrentUser } from '../functions';
import axios from 'axios';
import { io } from 'socket.io-client';
const bcrypt = require('bcryptjs');

function Chat(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { selectedUser, setSelectedUser, userId } = props;

  
  function generateRoomId(userId1, userId2) {
    const sortedUserIds = [userId1, userId2].sort().join('');
    return sortedUserIds;
}
  const roomId = generateRoomId(selectedUser,userId)


  const socket = io.connect('http://localhost:3001');

  const fetchMsgs = React.useCallback(async () => {
    if (userId && selectedUser) {
      try {
        await axios.get(`/api/get-msgs/${userId}/${selectedUser}/${false}`).then((res) => {
          setMessages(res.data.messages)
        });
      } catch (error) {
        console.error('Error fetching messages', error.message);
      }
    }
  }, [userId, selectedUser]);


  const fetchLatestMsgs = React.useCallback(async () => {
    if (userId && selectedUser) {
      try {
        await axios.get(`/api/get-msgs/${userId}/${selectedUser}/${true}`).then((res) => {
          setMessages(prevMessages => [...prevMessages, res.data.messages]);
        });
      } catch (error) {
        console.error('Error fetching notifications', error.message);
      }
    }
  }, [userId, selectedUser, messages]);


  const sendMsg = React.useCallback(async () => {
      if (userId && selectedUser) {
          try {
              socket.emit('send-msg', {
                  senderId: userId,
                  recieverId : selectedUser,
                  msg: inputText,
                  roomId
              });
              setInputText('')
              // fetchLatestMsgs()
          } catch (error) {
              console.error('Error', error.message);
          }
      }
  }, [userId,selectedUser,inputText,roomId]);

  // const sendMsg = React.useCallback(async () => {
  //   if (userId && selectedUser) {
  //     try {
  //       await axios.post('/api/send-msg', {
  //         senderId: userId,
  //         recieverId: selectedUser,
  //         msg: inputText
  //       }).then((res) => {
  //         setInputText('')
  //         fetchLatestMsgs()
  //       });
  //     } catch (error) {
  //       console.error('Error', error.message);
  //     }
  //   }
  // }, [userId, selectedUser, inputText]);

  const emitTypingStatus = () => {
    socket.emit('userTyping', { roomId, userId});
};

  const handleInputChange = (event) => {
    const typing = event.target.value.length > 0;
    if (typing) {
        emitTypingStatus();
    }
};
  React.useEffect(() => {
    fetchMsgs()
  }, [userId])

  React.useEffect(() => {
    socket.emit('join-chat', roomId);
    socket.on('getLatestMsg', (msg) => {
      if (!messages.some(m => m._id === msg._id)) {
        setMessages(prevMessages => [...prevMessages, msg]);
    }
    });
    
    return () => {
        socket.emit('leave-chat', roomId);
    };
}, [roomId,messages]);


socket.on('typing', ({ senderId }) => {
    if (senderId !== userId) {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
        }, 2000);
    }
});

  return (
    <div className="chat-container">
      <div className="chat-header">Chat</div>
      <div className="chat-header"><button onClick={() => { setSelectedUser(null) }}>Back</button></div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div style={{ display: "flex", minHeight: 10, width: "100%", justifyContent: message.senderId === userId ? "end" : "start" }}>
              <div key={message._id} className={`chat-message ${message.senderId === userId ? 'chat-message--self' : ''}`}>
                <p>{message.msg}</p>
              </div>
            </div>
          )
        })}
        {isTyping ? <p>Typing...</p> : null}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => {setInputText(e.target.value);handleInputChange(e)}}
          onKeyPress={(e) => e.key === 'Enter' && sendMsg()}
        />
        <button onClick={sendMsg}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
