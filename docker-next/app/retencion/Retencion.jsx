// components/RetentionPolicyPopup.jsx

import React, { useState, useContext } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { AuthContext } from '../context/AuthContext';  // Make sure the path matches where the AuthContext is defined
import '../../styles.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';



const RetentionPolicyPopup = ({ bucketId }) => {
  const [open, setOpen] = useState(false); // State to manage the dialog open/close status
  const [retention, setRetention] = useState(''); // State to manage the retention duration
  const { scopes, isAuthenticated } = useContext(AuthContext); // Use useContext to access the current authentication context

  // Function to handle opening the dialog
  const handleClickOpen = () => {
    if (hasAdminScope) {
        setOpen(true);
        fetchCurrentRetention();
    } else {
        alert('You do not have permission to manage users.');
    }
};
  // Function to handle closing the dialog
  const handleClose = () => {
    setOpen(false);
  };

    // Check if the user has admin scope
  const hasAdminScope = scopes.includes('admin');
    if (!hasAdminScope) {
        return <div></div>;
    }

      // Function to fetch the current retention policy
  const fetchCurrentRetention = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://localhost:8000/get-retention`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRetention(secondsToDuration(data.retention));
      } else {
        throw new Error('Failed to fetch retention policy');
      }
    } catch (error) {
      console.error('Error fetching retention policy:', error);
      alert('Error fetching retention policy: ' + error.message);
    }
  };

    // Function to handle saving the new retention policy
  const handleSave = async () => {
    try {
      console.log(retention)
      const token = localStorage.getItem('token');
      const response = await fetch(`https://localhost:8000/update-retention`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ retention }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      alert('Retention policy updated successfully');
    } catch (error) {
      alert('Failed to update the retention policy: ' + error.message);
    } finally {
      setOpen(false);
    }
  };

  // Helper to convert seconds to a human-readable format
  function secondsToDuration(sec) {
    const weeks = Math.floor(sec / 604800);
    if (weeks > 0) return `${weeks}w`;
    const days = Math.floor(sec / 86400);
    if (days > 0) return `${days}d`;
    const hours = Math.floor(sec / 3600);
    if (hours > 0) return `${hours}h`;
    const minutes = Math.floor(sec / 60);
    if (minutes > 0) return `${minutes}m`;
    return `${sec}s`;
  }

  // Create a custom theme for the MUI components
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
    <ThemeProvider theme={theme}>
      <Button className="manage-users-button" onClick={handleClickOpen}>
        Change Retention Policy
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Set Retention Policy</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Current Policy: <strong>{retention || "Not set"}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Enter a value like 1w, 30d, or 1y. Use '0s' for no retention.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="retention"
            label="Retention Duration"
            type="text"
            fullWidth
            variant="outlined"
            placeholder="e.g., 1w, 30d, 1y"
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default RetentionPolicyPopup;