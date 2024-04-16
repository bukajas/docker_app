import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileDownload from 'js-file-download';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  FormLabel,
} from '@mui/material';

const DataExportForm2 = () => {
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [useMinutesAgo, setUseMinutesAgo] = useState(false);
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [minutesAgo, setMinutesAgo] = useState('');
  const [tagFilters, setTagFilters] = useState({});
  const [timeFrameSubmitted, setTimeFrameSubmitted] = useState(false);

  const handleTagFilterChange = (tag, value) => {
    setTagFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      let computedFromTime = fromTime;
      let computedToTime = toTime;
      if (minutesAgo) {
        const now = new Date();
        const from = new Date(now.getTime() - minutesAgo * 60000);
        computedFromTime = from.toISOString().slice(0, 16);
        computedToTime = now.toISOString().slice(0, 16);
      }

      const response = await fetch(`http://localhost:8000/filtered_measurements_with_tags?start=${computedFromTime}&end=${computedToTime}`, {
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

  const handleTimeFrameSubmit = async (e) => {
    e.preventDefault();
    fetchData();
    setTimeFrameSubmitted(true);
  };

  const handleNow = () => {
    const now = new Date().toISOString().slice(0, 16);
    setFromTime(now);
    setToTime(now);
  };

  useEffect(() => {
    if (fromTime && toTime || minutesAgo) {
      setTimeFrameSubmitted(true);
    } else {
      setTimeFrameSubmitted(false);
    }
  }, [fromTime, toTime, minutesAgo]); // Dependencies on time inputs


  return (
    <form onSubmit={handleTimeFrameSubmit}>
      <FormControl component="fieldset" margin="normal">
        <FormLabel component="legend">Time Input Mode</FormLabel>
        <FormControlLabel
          control={<Switch checked={useMinutesAgo} onChange={(e) => setUseMinutesAgo(e.target.checked)} />}
          label={useMinutesAgo ? 'Minutes from Now' : 'Start and End Time'}
        />
      </FormControl>
      {useMinutesAgo ? (
        <TextField
          type="number"
          label="Minutes from Now"
          value={minutesAgo}
          onChange={e => setMinutesAgo(e.target.value)}
          fullWidth
          margin="normal"
        />
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
          />
        </>
      )}
      <Button onClick={handleNow} variant="contained" color="primary">
        Now
      </Button>
      {timeFrameSubmitted && (
        <>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="measurement-select-label">Measurement</InputLabel>
            <Select
              value={selectedMeasurement}
              label="Measurement"
              onChange={(e) => {
                setSelectedMeasurement(e.target.value);
              }}
            >
              <MenuItem value=""> 
                <em>Default</em> 
              </MenuItem>
            {Object.keys(measurements).map((measurement) => (
              <MenuItem key={measurement} value={measurement}>
                {measurement}
              </MenuItem>
            ))}
            </Select>
          </FormControl>
          {selectedMeasurement && measurements[selectedMeasurement].map((tag, index) => (
            <TextField
              key={index}
              label={tag}
              variant="outlined"
              fullWidth
              value={tagFilters[tag] || ''}
              onChange={(e) => handleTagFilterChange(tag, e.target.value)}
              sx={{ mt: 2 }}
            />
          ))}
        </>
      )}
    </form>
  );
};

export default DataExportForm2;
