"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch,

  Paper
} from '@mui/material';
import { format } from 'date-fns';

const DataEditor = () => {
  const [measurements, setMeasurements] = useState({});
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [rangeInMinutes, setRangeInMinutes] = useState('');
  const [tagFilters, setTagFilters] = useState({});
  const [data, setData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [useMinutesAgo, setUseMinutesAgo] = useState(false);
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [range, setRange] = useState('');
  const [rangeUnit, setRangeUnit] = useState('minutes'); // Default value is minutes
  const [timeFrameSubmitted, setTimeFrameSubmitted] = useState(false);
  const [tags, setTags] = useState([]);



  const formatDataList = (dataList) => {
    const excludedKeys = ['field', 'result', 'table', '_field'];
  
    return dataList.map(item => {
      const newItem = {};
  
      Object.keys(item).forEach((key) => {
        if (!excludedKeys.includes(key)) {
          newItem[key] = item[key];
        }
      });
  
      return newItem;
    });
  };

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

  const handleTagFilterChange = (tag, value) => {
    setTagFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
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

  useEffect(() => {
    if (fromTime && toTime || range) {
      setTimeFrameSubmitted(true);
    } else {
      setTimeFrameSubmitted(false);
    }
  }, [fromTime, toTime, range]); // Dependencies on time inputs

  const fetchData = async () => {
    try {
      const body = {
        measurement: selectedMeasurement,
        range,
        tag_filters: tagFilters,
        start_time: fromTime,
        end_time: toTime,
        interval: rangeUnit
      }
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/modify_data_read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const responseData = await response.json();
      const sortedData = responseData.sort((a, b) => {
        return new Date(a.time) - new Date(b.time);
      });
      const formattedList = formatDataList(sortedData);

      setData(formattedList);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };


  const handleEdit = (index) => {
    setEditIndex(index);
    setEditValue(data[index].value);
  };


  // TODO time formating seems to be the problem
  
const handleDelete = async (index) => {
  const item = data[index-1]

    // Construct your request payload using the selectedMeasurement, rangeInMinutes, and tagFilters
    const excludedKeys = ['_measurement', '_field', 'result', 'time', 'table', "value"];
    const result = {};

    Object.keys(index).forEach(key => {
      if (!excludedKeys.includes(key)) {
        result[key] = index[key];
      }
    });
    const payload = {
      measurement: index["_measurement"],
      tag_filters: result, // or deleteTagFilters if using separate state
      time: index["time"], // or deleteRangeInMinutes if using separate state
    };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/modify_data_delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      setEditIndex(null); // Reset edit index
      fetchData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };




  const handleUpdate = async (index) => {

    if (editIndex === null) {
      console.error("No item selected for update");
      return;
    }
    // Assuming the data item has a 'time' field to identify it.
    // This part might need adjustment based on your data structure.
    const itemToUpdate = data[editIndex];
    if (!itemToUpdate) {
      console.error("Invalid item selected");
      return;
    }
    const excludedKeys = ['_measurement', "_field", 'result', 'time',"table", "value"];
    const result = {};

    Object.keys(index).forEach(key => {
      if (!excludedKeys.includes(key)) {
        if (key === 'table') {
        result[key] = String(index[key]); // Convert value to string
      } else {
        result[key] = index[key];
      }
      }
    });
    const payload = {
      measurement: index["_measurement"],
      tag_filters: result, // or deleteTagFilters if using separate state
      time: index["time"], // or deleteRangeInMinutes if using separate state
      new_value: editValue,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/modify_data_update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setEditIndex(null); // Reset edit index
      fetchData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating data:', error);
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

  const renderTableRows = () => {
    return data.map((item, index) => (
      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        {/* Display all item's parameters dynamically */}
        {Object.keys(item).map((key, keyIndex) => (
          <TableCell key={keyIndex} align={keyIndex === 0 ? "left" : "right"}>
            {editIndex === index && key === 'value' ? (
              <TextField
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                fullWidth
              />
            ) : (
              item[key]
            )}
          </TableCell>
        ))}
        {/* Edit and Save/Cancel Buttons */}
        <TableCell align="right">
          {editIndex === index ? (
            <>
              <Button variant="contained" onClick={() => handleUpdate(item)} sx={{ mr: 1 }}>Save</Button>
              <Button variant="outlined" onClick={() => setEditIndex(null)}>Cancel</Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => { setEditIndex(index); setEditValue(item.value); }}>
              Edit
            </Button>
          )}
        </TableCell>
        <TableCell align="right">
          <Button onClick={() => handleDelete(item)} variant="contained" color="error">
            Delete
          </Button>
        </TableCell>
      </TableRow>
    ));
  };


return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: 2 }}>
      <Typography variant="h6">Data Editor</Typography>
      <Grid container spacing={2}>
        {/* Range, Measurement Selection, and Tag Filters remain the same */}
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
        <Grid item xs={12}>

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
      </FormControl>
      </>
      )}
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
          <Button onClick={fetchData} variant="contained" color="primary" sx={{ mt: 2 }}>
            Fetch Data
          </Button>
        </Grid>


        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  {/* Generate table headers dynamically based on the first item's keys if data exists */}
                  {data[0] && Object.keys(data[0]).map((key, index) => (
                    <TableCell key={index} align={index === 0 ? "left" : "right"}>{key}</TableCell>
                  ))}
                  <TableCell align="right">Actions</TableCell>
                  <TableCell align="right">Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderTableRows()}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataEditor;