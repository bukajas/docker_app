import React, { useState, useEffect } from 'react';
import { MenuItem, TextField, Button, FormControl, InputLabel, Select, Box, RadioGroup, FormControlLabel, Radio, Grid } from '@mui/material';

const DeleteDataForm = () => {
  const [measurements, setMeasurements] = useState({});
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [tags, setTags] = useState({});
  const [token, setToken] = useState('');
  const [timeOption, setTimeOption] = useState('minutes');
  const [minutes, setMinutes] = useState('');
  // Separate states for date and time selections
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token'); // Ensure you have a token stored in localStorage
        const response = await fetch('http://localhost:8000/filtered_measurements_with_tags', {
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
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = 'http://127.0.0.1:8000/delete_data';
    // Combine date and time for start and end times
    const body = {
      measurement: selectedMeasurement, 
      tags,
      ...(timeOption === 'minutes' ? { minutes: parseInt(minutes, 10) } : {}),
      ...(timeOption === 'range' ? { start_time: `${startDate}T${startTime}`, stop_time: `${endDate}T${endTime}` } : {}),
    };
    console.log(body)
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to delete the measurement data');
      }

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting measurement data');
    }
  };

  const renderTagInputs = () => {
    const measurementTags = measurements[selectedMeasurement] || [];
    return measurementTags.map((tag) => (
      <TextField
        key={tag}
        label={tag}
        variant="outlined"
        margin="normal"
        fullWidth
        onChange={(e) => setTags({ ...tags, [tag]: e.target.value })}
        required
      />
    ));
  };

  const renderTimeInput = () => {
    if (timeOption === 'minutes') {
      return (
        <TextField
          label="Delete Data Older Than (Minutes)"
          type="number"
          fullWidth
          margin="normal"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          required
          InputProps={{ inputProps: { min: 0 } }}
        />
      );
    } else {
      return (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="End Time"
              type="time"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </Grid>
        </Grid>
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <FormControl fullWidth margin="normal">
        <InputLabel>Measurement</InputLabel>
        <Select
          value={selectedMeasurement}
          label="Measurement"
          onChange={(e) => {
            setSelectedMeasurement(e.target.value);
            setTags({});
          }}
        >
          {Object.keys(measurements).map((measurement) => (
            <MenuItem key={measurement} value={measurement}>
              {measurement}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedMeasurement && renderTagInputs()}
      <FormControl component="fieldset">
        <RadioGroup
          row
          name="timeOption"
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
        >
          <FormControlLabel value="minutes" control={<Radio />} label="Minutes" />
          <FormControlLabel value="range" control={<Radio />} label="Start/End Time" />
        </RadioGroup>
      </FormControl>
      {renderTimeInput()}
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Delete Data
      </Button>
    </Box>
  );
};

export default DeleteDataForm;
