"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState('');

  useEffect(() => {
    // Check if the user is logged in when the component mounts
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setLoggedInUsername(storedUsername);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/token', `username=${username}&password=${password}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', username); // Store the username
      setIsLoggedIn(true);
      setLoggedInUsername(username);
      alert('Login successful!');
    } catch (error) {
      alert('Login failed!');
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username'); // Remove the username
    setIsLoggedIn(false);
    setLoggedInUsername('');
    alert('Logout successful!');
  };

  const fetchSecureMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/secure-endpoint', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error fetching secure message:', error);
      alert('Failed to fetch secure message. Make sure you are logged in.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {!isLoggedIn ? (
        <form onSubmit={handleLogin}>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <p>Welcome, {loggedInUsername}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
      <button onClick={fetchSecureMessage}>Fetch Secure Message</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Login;
