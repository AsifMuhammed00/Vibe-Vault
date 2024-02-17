import React, { useState, useCallback } from 'react';
import './search-result.css';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../functions';


const Results = ({ currentUser, user, requestedUsers, incomingRequests, friends }) => {
  const [isReqSent, setIsReqSent] = React.useState(false)
  const [isRequestedUser, setRequestedUser] = React.useState(false)

  const [isAccepted, setIsAccepted] = React.useState(false)
  const [isAlreadyFriend, setIsAlreadyFriend] = React.useState(false)


  const handleReqAccept = useCallback(async () => {
    setIsAccepted(true)
    try {
      await await axios.post('/api/accept-req', {
        userId: user._id,
        requestedUserId: currentUser,
      }).then((res) => {

      });
    } catch (error) {
      setIsAccepted(false)
      console.error('Error', error.message);
    }
  }, [currentUser]);


  const handleSendRequest = useCallback(async () => {
    setIsReqSent(true)
    try {
      await await axios.post('/api/send-req', {
        to: user._id,
        from: currentUser,
        status: "Requested"
      }).then((res) => {

      });
    } catch (error) {
      setIsReqSent(false)
      console.error('Error', error.message);
    }
  }, [currentUser]);

  const cancelRequest = useCallback(async () => {
    setIsReqSent(false)
    try {
      await await axios.delete(`/api/cancel-requests/${user._id}/${currentUser}`).then((res) => {
      });
    } catch (error) {
      console.error('Error', error.message);
      setIsReqSent(true)
    }
  }, [currentUser]);

  React.useEffect(() => {
    const alreadyRequested = requestedUsers.find((u) => {
      return u === user._id
    })
    if (Boolean(alreadyRequested)) {
      setIsReqSent(true)
    }
    const incomingRequested = incomingRequests.find((u) => {
      return u === user._id
    })
    if (Boolean(incomingRequested)) {
      setRequestedUser(true)
    }
    const isFriend = friends?.find((u) => {
      return u === user._id
    })
    if (Boolean(isFriend)) {
      setIsAlreadyFriend(true)
    }

  }, [requestedUsers, incomingRequests,friends])

  console.log("isAlreadyFriend",isAlreadyFriend)


  return (
    <div key={user._id} className="user-card">
      <img src={'https://i.pinimg.com/736x/dc/3d/ef/dc3defd9307e2fda14dc377691be1c62.jpg'} alt={user.name} className="profile-pic" />
      <div className="user-info">
        <Link to={`/profile/${user._id}`}><span className="profile-name">{user.name}{currentUser === user._id ? "(You)" : null}</span></Link>

        {isAlreadyFriend ? (
          <h4>Friend</h4>
        ):(
          isRequestedUser ? (
            <button
              className="request-button"
              disabled={isAccepted}
              onClick={() => { handleReqAccept() }}
            >
              {isAccepted ? "Accepted" : "Accept Request"}
            </button>
          ) : (
            user._id !== currentUser && (
              <button
                className="request-button"
                onClick={() => { isReqSent ? cancelRequest() : handleSendRequest(); }}
              >
                {isReqSent ? "Cancel Request" : "Request"}
              </button>
            )
          )
        )}
      </div>
    </div>
  )
}

const SearchResults = ({ }) => {
  const [results, setResults] = React.useState([])
  const [requestedUsers, setRequestedUsers] = React.useState([])
  const [incomingRequests, setIncomingRequests] = React.useState([])

  const search = useLocation().search;
  const current = useCurrentUser()

  const getSearchValue = React.useMemo(() => {
    return new URLSearchParams(search).get('key');
  }, [search])

  const getSearchResults = useCallback(async () => {
    if (getSearchValue) {
      try {
        await axios.get(`/api/search/${getSearchValue}`).then((res) => {
          setResults(res.data);
        });
      } catch (error) {
        console.error('Error fetching results', error.message);
      }
    }
  }, [getSearchValue]);

  const getRequests = useCallback(async () => {
    try {
      await axios.get(`/api/find-reqs/${current?.user?._id}`).then((res) => {
        setRequestedUsers(res.data)
      });
    } catch (error) {
      console.error('Error', error.message);
    }
  }, [current]);

  const getIncomingRequests = useCallback(async () => {
    try {
      await axios.get(`/api/get-reqs/${current?.user?._id}`).then((res) => {
        const requestedIds = res.data.map((user) => user._id)
        setIncomingRequests(requestedIds)
      });
    } catch (error) {
      console.error('Error', error.message);
    }
  }, [current]);



  React.useEffect(() => {
    if (current?.user?._id) {
      getRequests()
      getIncomingRequests()
    }
  }, [current])

  React.useEffect(() => {
    getSearchResults()
  }, [getSearchValue])

  return (
    <div style={{ padding: 30 }}>
      <div className="search-results">
        <div><h2>Showing results for "{getSearchValue}"</h2></div>
        {results.map((user) => {
          return (
            // <div key={user._id} className="user-card">
            //   <img src={'https://i.pinimg.com/736x/dc/3d/ef/dc3defd9307e2fda14dc377691be1c62.jpg'} alt={user.name} className="profile-pic" />
            //   <div className="user-info">
            //   <Link to={`/profile/${user._id}`}><span className="profile-name">{user.name}</span></Link>
            //     <button
            //       className="request-button"
            //     >
            //       Request
            //     </button>
            //   </div>
            // </div>
            <Results user={user} currentUser={current?.user?._id} friends={current?.user?.friends} requestedUsers={requestedUsers} incomingRequests={incomingRequests} />
          )
        })}
      </div>
    </div>
  );
};

export default SearchResults;
