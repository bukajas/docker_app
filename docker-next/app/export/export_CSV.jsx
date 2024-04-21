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
import DynamicDropdownMenu from "../components/Selection_component"
import dayjs from 'dayjs';


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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [combinedData, setCombinedData] = useState({})

  const handleTagFilterChange = (tag, value) => {
    setTagFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
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
          data: combinedData,
          start_time: startDate.format('YYYY-MM-DD HH:mm:ss'),
          end_time: endDate.format('YYYY-MM-DD HH:mm:ss'),
        }
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
      FileDownload(csvContent, 'export.csv');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };



  const handleTimeFrameSubmit = async (e) => {
    e.preventDefault();
    // fetchData();
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
      // fetchData();
    } else {
      setTimeFrameSubmitted(false);
      // fetchData();
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

  const handleUpdate = (newData) => {
    setCombinedData(newData);
};

  return (
    <form onSubmit={handleTimeFrameSubmit}>
      <DateTimeForm
              initialStartDate={startDate}
              initialEndDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              currentTime={currentTime}
            />
        <DynamicDropdownMenu
          onUpdate={handleUpdate}
          startDate={startDate}
          endDate={endDate}
        />


      {/* <Button onClick={handleNow} variant="contained" color="primary">
        Now
      </Button> */}
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
