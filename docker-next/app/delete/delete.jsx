import React, { useState, useEffect } from 'react';
import { MenuItem, TextField, Button, FormControl, InputLabel, Select, Box, RadioGroup, FormControlLabel, Radio, Grid, Switch } from '@mui/material';
import DynamicDropdownMenu from '../components/Selection_component'
import dayjs from 'dayjs';

import DateTimeForm from '../components/Time_component'


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
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [combinedData, setCombinedData] = useState({})
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");



  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const apiUrl = 'https://127.0.0.1:8000/delete_data';
    // Combine date and time for start and end times
    const body = {
      data: combinedData,
      start_time: startDate.format('YYYY-MM-DD HH:mm:ss'),
      end_time: endDate.format('YYYY-MM-DD HH:mm:ss'),
    };
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

  const handleUpdate = (newData) => {
    setCombinedData(newData);
};


  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      
      <FormControl component="fieldset">
        <RadioGroup
          row
          name="timeOption"
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
        >
          <DateTimeForm
              initialStartDate={startDate}
              initialEndDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              currentTime={currentTime}
            />
          
        </RadioGroup>
      </FormControl>
      <DynamicDropdownMenu
          onUpdate={handleUpdate}
          startDate={startDate}
          endDate={endDate}
        />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Delete Data
      </Button>
    </Box>
  );
};

export default DeleteDataForm;
