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
  Grid,
} from '@mui/material';
import DateTimeForm from '../components/Time_component'

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
  const [range, setRange] = useState('');
  const [rangeUnit, setRangeUnit] = useState('minutes'); // Default value is minutes

  const handleTagFilterChange = (tag, value) => {
    setTagFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      let computedFromTime = fromTime;
      let computedToTime = toTime;
      if (range) {
        const now = new Date();
        const from = new Date(now.getTime() - range * 60000);
        computedFromTime = from.toISOString().slice(0, 16);
        computedToTime = now.toISOString().slice(0, 16);
      }

      const response = await fetch(`https://localhost:8000/filtered_measurements_with_tags?start=${computedFromTime}&end=${computedToTime}`, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        let computedFromTime = fromTime;
        let computedToTime = toTime;
        if (range) {
          const now = new Date();
          const from = new Date(now.getTime() - range * 1000);
          computedFromTime = from.toISOString().slice(0, 16);
          computedToTime = now.toISOString().slice(0, 16);
        }

       
        const payload = {
            measurement: selectedMeasurement,
            tag_filters: tagFilters, 
            start_time: fromTime,
            range,
            end_time: toTime,
            interval: rangeUnit
          };
        const token = localStorage.getItem('token');
        const response = await fetch('https://127.0.0.1:8000/export_csv', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      const csvContent = await response.text();
      FileDownload(csvContent, 'export.csv');
    } catch (error) {
      console.error('Error exporting data:', error);
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
    if (fromTime && toTime || range) {
      setTimeFrameSubmitted(true);
      fetchData();
    } else {
      setTimeFrameSubmitted(false);
      fetchData();
    }
  }, [fromTime, toTime, range]); // Dependencies on time inputs


  const handleSwitchChange = (event) => {
    setUseMinutesAgo(event.target.checked);
    if (event.target.checked) {
      setFromTime('');
      setToTime('');
    } else {
      setRange('');
    }
  };

  return (
    <form onSubmit={handleTimeFrameSubmit}>
      <FormControl component="fieldset" margin="normal">
        <FormLabel component="legend">Time Input Mode</FormLabel>
        <FormControlLabel
          control={<Switch checked={useMinutesAgo} onChange={handleSwitchChange} />}
          label={useMinutesAgo ? 'Minutes from Now' : 'Start and End Time'}
        />
      </FormControl>
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
       <Button onClick={handleSubmit} type="submit" variant="contained" color="primary">
        Export Data
      </Button>
    </form>
  );
};

export default DataExportForm2;
