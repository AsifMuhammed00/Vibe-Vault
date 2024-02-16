import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import "./App.css";

// Replace with your custom components or links
import Home from './pages/home';
import About from './pages/about';
import Contact from './pages/contact';
import MyProfile from './pages/my-profile';
import Header from './components/Navbar';

import { useCurrentUser } from './functions/index';

import LoginRegisterPage from './pages/login-register'


const App = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = "/login-register"
  }

  const SiderBar = () => (
    <div className="siderbar">
      <div className="logo">Your App Logo</div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/my-profile">My Profile</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
          <li>
            <button onClick={() => { handleLogout() }}>Logout</button>
          </li>
        </ul>
      </nav>
    </div>
  );



  const ContentArea = () => (
    <main>
      <div className="header"><Header /></div>
      <div className="content-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </main>
  );



  const current = useCurrentUser();


  if (current.loading) {
    return "Loading..."
  }



  if (window.location.pathname === "/login-register") {
    if (current.isAuthenticated) {
      window.location.href = "/"
    }
    return (
      <div>
        <Router>
          <Routes>
            <Route path="/login-register" element={<LoginRegisterPage />} />
          </Routes>
        </Router>
      </div>
    )
  } else {
    if (!current.isAuthenticated) {
      window.location.href = "/login-register"
    }
    return (
      <Router>
        <Routes>
          <Route path="/login-register" element={<LoginRegisterPage />} />
        </Routes>
        <div className="app">
          <SiderBar style={{ display: collapsed ? 'none' : 'block' }} />
          <div className="main-content">
            {/* <HeaderBar /> */}
            <ContentArea />
          </div>
        </div>
      </Router>
    );
  };
}


export default App;
