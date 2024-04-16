import React, { useState, useEffect } from 'react';
import { MenuItem, TextField, Button, FormControl, InputLabel, Select, Box, RadioGroup, FormControlLabel, Radio, Grid, Switch } from '@mui/material';

const DeleteDataForm = () => {
  const [measurements, setMeasurements] = useState({});
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [tags, setTags] = useState({});
  const [token, setToken] = useState('');
  const [timeOption, setTimeOption] = useState('minutes');
  const [minutes, setMinutes] = useState('');
  const [useMinutesAgo, setUseMinutesAgo] = useState(false);
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [range, setRange] = useState('');
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [rangeUnit, setRangeUnit] = useState('minutes'); // Default value is minutes
  const [timeFrameSubmitted, setTimeFrameSubmitted] = useState(false);


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
      range,
      start_time: fromTime,
      end_time: toTime,
      // ...(timeOption === 'minutes' ? { range: parseInt(minutes, 10) } : {}),
      // ...(timeOption === 'range' ? { start_time: `${startDate}T${startTime}`, stop_time: `${endDate}T${endTime}` } : {}),
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
  const handleSwitchChange = (event) => {
    setUseMinutesAgo(event.target.checked);
    if (event.target.checked) {
      setFromTime('');
      setToTime('');
    } else {
      setRange('');
    }
  };

  const handleNow = () => {
    const now = new Date().toISOString().slice(0, 16);
    setFromTime(now);
    setToTime(now);
  };
  // Add useEffect to monitor time inputs
  useEffect(() => {
    if (fromTime && toTime || range) {
      setTimeFrameSubmitted(true);
    } else {
      setTimeFrameSubmitted(false);
    }
  }, [fromTime, toTime, range]); // Dependencies on time inputs


  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      
      <FormControl component="fieldset">
        <RadioGroup
          row
          name="timeOption"
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
        >
          <FormControlLabel
          control={<Switch checked={useMinutesAgo} onChange={handleSwitchChange} />}
          label={useMinutesAgo ? 'Minutes from Now' : 'Start and End Time'}
        />
        {useMinutesAgo ? (
                   <Grid container spacing={2}>
                   <Grid item xs={6}>
                     <TextField
                       label="Range"
                       variant="outlined"
                       fullWidth
                       value={range}
                       onChange={(e) => setRange(e.target.value)}
                       sx={{ mt: 2 }}
                     />
                  
                   </Grid>
                   <Grid item xs={6}>
                     <FormControl variant="outlined" fullWidth sx={{ mt: 2 }}>
                       <InputLabel id="range-unit-label">Unit</InputLabel>
                       <Select
                         labelId="range-unit-label"
                         id="range-unit-select"
                         value={rangeUnit}
                         onChange={(e) => setRangeUnit(e.target.value)}
                         label="Unit"
                       >
                         <MenuItem value="seconds">Seconds</MenuItem>
                         <MenuItem value="minutes">Minutes</MenuItem>
                         <MenuItem value="hours">Hours</MenuItem>
                       </Select>
                     </FormControl>
                   </Grid>
                 </Grid>
      ) : (
        <>
          <TextField
            type="datetime-local"
            label="From Time"
            value={fromTime}
            onChange={e => setFromTime(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              step: 1, // To include seconds
            }}
          />
          <TextField
            type="datetime-local"
            label="To Time"
            value={toTime}
            onChange={e => setToTime(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              step: 1, // To include seconds
            }}
          />
            <Button onClick={handleNow} variant="contained" color="primary">
            Now
          </Button>
        </>
      )}
        </RadioGroup>
      </FormControl>
      {timeFrameSubmitted && (
        <>
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
          <MenuItem value=""> {/* This MenuItem represents the empty default value */}
            <em>Default</em> {/* This can be styled or changed to say "Select", "None", or any placeholder text */}
          </MenuItem>
          {Object.keys(measurements).map((measurement) => (
            <MenuItem key={measurement} value={measurement}>
              {measurement}
            </MenuItem>
          ))}
        </Select>
        {selectedMeasurement && renderTagInputs()}
      </FormControl>
      </>
      )}
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Delete Data
      </Button>
    </Box>
  );
};

export default DeleteDataForm;
