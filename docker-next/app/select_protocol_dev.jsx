// components/Measurements.js
import { useState, useEffect } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function Measurements() {
  const [measurements, setMeasurements] = useState({});
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const token = 'YOUR_AUTH_TOKEN_HERE'; // Update this token as per your authentication mechanism

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/filtered_measurements_with_tags', {
          method: 'GET', // Adjust if your endpoint expects a different method
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setMeasurements(data.measurements_with_tags);
      } catch (error) {
        console.error('There was an error fetching the measurements:', error);
      }
    };

    fetchData();
  }, [token]);

  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <Typography variant="h6" component="div">
        Measurements
      </Typography>
      <List component="nav" aria-label="measurements">
        {Object.keys(measurements).map((measurement) => (
          <ListItem
            button
            key={measurement}
            onClick={() => setSelectedMeasurement(measurement)}
          >
            <ListItemText primary={measurement} />
          </ListItem>
        ))}
      </List>
      {selectedMeasurement && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" component="div">
            Tags for {selectedMeasurement}
          </Typography>
          {measurements[selectedMeasurement].map((tag, index) => (
            <TextField
              key={index}
              label={tag}
              variant="outlined"
              margin="normal"
              fullWidth
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default Measurements;
