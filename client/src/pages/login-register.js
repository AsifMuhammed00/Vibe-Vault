import React, { useState } from 'react';
import './login-register.css';
import axios from 'axios';

function LoginRegisterPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleToggleMode = () => {
    setIsLogin(prevMode => !prevMode);
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/register-user', {
        name,
        password,
        email
      });
      console.log(response.data);
      alert('User registered successfully');
      
    } catch (error) {
      console.error('Error registering user:', error.message);
      alert('Error registering user');
    }
  };

  const handleLoginSubmit = async (event) => {
    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        password,
        email
      });
      alert('User Logged in successfully');
      window.localStorage.setItem('token', response.data.token);
      
    } catch (error) {
      console.error('Error to login', error.message);
      alert('Error to login');
    }
  };


  return (
    <div className='login-wrapper'>
    <div className="login-register-container">
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
        <div className="form-group">
        {!isLogin && (
            <div>
             <label>Name:</label>
             <input
               type="text"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
             />
             </div>
        )}
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {!isLogin && (
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}
        <button  disabled={!isLogin && confirmPassword !== password} className="submit-btn" onClick={()=>{!isLogin? handleRegisterSubmit() : handleLoginSubmit()}}>
          {isLogin ? 'Login' : 'Register'}
          </button>
      <p>
        {isLogin
          ? "Don't have an account? "
          : 'Already have an account? '}
        <button type="button" onClick={handleToggleMode} className="toggle-btn">
          {isLogin ? 'Register here' : 'Login here'}
        </button>
      </p>
    </div>
    </div>
  );
}

export default LoginRegisterPage;
