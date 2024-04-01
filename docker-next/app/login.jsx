"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { createTheme, ThemeProvider } from '@mui/material/styles';


function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState('');
  const [open, setOpen] = useState(false); // Initially set to false to keep the dialog closed

  useEffect(() => {
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
      localStorage.setItem('username', username);
      setIsLoggedIn(true);
      setLoggedInUsername(username);
      setOpen(false); // Close the dialog on successful login
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setLoggedInUsername('');
    setOpen(false); // Close the dialog on logout
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

  const theme = createTheme({
    palette: {
      primary: {
        main: '#000000', // Example primary color
      },
      secondary: {
        main: '#dc3545', // Example secondary color
      },
    },
  });

  return (
    <div>
      <ThemeProvider theme={theme}>
      <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setOpen(true)} 
          style={{ minWidth: '200px', minHeight: '50px' }}>
          {isLoggedIn ? `Logged in as ${loggedInUsername}` : "Login / Check Status"}
        </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{isLoggedIn ? "Logged In" : "Login"}</DialogTitle>
        <DialogContent>
          {!isLoggedIn ? (
            <form onSubmit={handleLogin}>
              <TextField
                margin="dense"
                id="username"
                label="Username"
                type="text"
                fullWidth
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <TextField
                margin="dense"
                id="password"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Login</Button>
              </DialogActions>
            </form>
          ) : (
            <div>
              <p>Welcome, {loggedInUsername}!</p>
              <Button onClick={handleLogout}>Logout</Button>
              <Button onClick={fetchSecureMessage}>Fetch Secure Message</Button>
              {message && <p>{message}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </ThemeProvider>
    </div>
  );
}

export default Login;

