"use client";
// pages/register.js
import { useState, useContext } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import axios from 'axios';
import '../styles.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from './context/AuthContext';  // Make sure the path matches where the AuthContext is defined

const Register = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        password: '',
        email: ''
    });
    const { scopes,isAuthenticated } = useContext(AuthContext); // Use useContext to access the current authentication context


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://localhost:8000/register', {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                full_name: formData.fullName // Adjust according to your schema in FastAPI
            });
            setOpen(false);
        } catch (error) {
            console.error('There was an error registering the user:', error.response.data.detail);
            // Handle error (e.g., show error message)
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


    const hasAdminScope = scopes.includes('admin');
    const hasNorightcope = scopes.includes('noright');
    const hasReadScope = scopes.includes('read');
    const hasReadWriteScope = scopes.includes('read+write');


    return (
        <div>
            <ThemeProvider theme={theme}>

            {(!hasAdminScope && !hasNorightcope && !hasReadScope && !hasReadWriteScope) && (
            <Button className="manage-users-button" variant="outlined" onClick={handleClickOpen}>
                Register
            </Button>
            )}
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Register</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            name="username"
                            label="Username"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="dense"
                            name="fullName"
                            label="Full Name"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="dense"
                            name="email"
                            label="Email Address"
                            type="email"
                            fullWidth
                            variant="standard"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="dense"
                            name="password"
                            label="Password"
                            type="password"
                            fullWidth
                            variant="standard"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit">Register</Button>
                    </DialogActions>
                </form>
            </Dialog>
            </ThemeProvider>
        </div>
    );
}

export default Register;
