import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileDownload from 'js-file-download';
import { 
    TextField,
    Button,
    Checkbox,
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


  const handleTagFilterChange = (tag, value) => {
    setTagFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
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

//   useEffect(() => {
//     if (selectedMeasurement) {
//       const found = measurements.find(m => m.measurement === selectedMeasurement);
//       setTags(found ? found.tags : []);
//     }
//   }, [selectedMeasurement, measurements]);

  const handleNow = () => {
    const now = new Date().toISOString().slice(0, 16);
    setFromTime(now);
    setToTime(now);
  };
  const handleSwitchChange = (event) => {
    setUseMinutesAgo(event.target.checked);
    if (event.target.checked) {
      setFromTime('');
      setToTime('');
    } else {
      setMinutesAgo('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        let computedFromTime = fromTime;
        let computedToTime = toTime;
        if (minutesAgo) {
          const now = new Date();
          const from = new Date(now.getTime() - minutesAgo * 60000);
          computedFromTime = from.toISOString().slice(0, 16);
          computedToTime = now.toISOString().slice(0, 16);
        }
        console.log(computedFromTime,computedToTime)
       
        const payload = {
            measurement: selectedMeasurement,
            tag_filters: tagFilters, 
            start_time: computedFromTime,
            end_time: computedToTime,
          };
          console.log(JSON.stringify(payload))
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/export_csv', {
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
      console.log(csvContent)
      FileDownload(csvContent, 'export.csv');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="measurement-select-label">Measurement</InputLabel>
            <Select
              value={selectedMeasurement}
              label="Measurement"
              onChange={(e) => {
                setSelectedMeasurement(e.target.value);
              }}
            >
          {Object.keys(measurements).map((measurement) => (
            <MenuItem key={measurement} value={measurement}>
              {measurement}
            </MenuItem>
          ))}
          </Select>
        </FormControl>
        {selectedMeasurement &&
                measurements[selectedMeasurement].map((tag, index) => (
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
        <FormControl component="fieldset" margin="normal">
        <FormLabel component="legend">Time Input Mode</FormLabel>
        <FormControlLabel
          control={<Switch checked={useMinutesAgo} onChange={handleSwitchChange} />}
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
          />
          <TextField
            type="datetime-local"
            label="To Time"
            value={toTime}
            onChange={e => setToTime(e.target.value)}
            fullWidth
            margin="normal"
          />
        </>
      )}
      <Button onClick={handleNow} variant="contained" color="primary">
        Now
      </Button>
      <Button onClick={handleSubmit} type="submit" variant="contained" color="primary">
        Export Data
      </Button>
    </form>
  );
};

export default DataExportForm2;
