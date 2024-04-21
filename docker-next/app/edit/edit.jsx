"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
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
  Paper,
  TablePagination
} from '@mui/material';
import { format } from 'date-fns';
import DynamicDropdownMenu from '../components/Selection_component'
import dayjs from 'dayjs';
import RightDrawer from '../components/Drawer_settings'
import DateTimeForm from '../components/Time_component'



const sortDataByTime = (data) => {

  // Iterate over each measurement list
  for (const measurement in data) {
      // Sort the measurement list by time
      data[measurement].sort((a, b) => new Date(a.time) - new Date(b.time));
  }
  
  return data;
}

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [combinedData, setCombinedData] = useState({})
  const [selectionsFromDrawer, setSelectionsFromDrawer] = useState([]);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [currentMeasurement, setCurrentMeasurement] = useState(null);

  const handleMeasurementChange = (measurement) => {
    setCurrentMeasurement(measurement);
  };


  const formatDataList = (dataList) => {
    // Check if dataList is an object
    if (typeof dataList !== 'object' || Array.isArray(dataList)) {
        console.error("Error: dataList is not an object.");
        return {};
    }

    const excludedKeys = ['field', 'result', 'table', '_field'];

    const formattedData = {};

    // Iterate over each measurement list in the dataList
    for (const measurement in dataList) {
        const measurementData = dataList[measurement];
        // Apply the format operation to each measurement list
        formattedData[measurement] = measurementData.map(item => {
            const newItem = {};

            // Copy over key-value pairs excluding excludedKeys
            Object.keys(item).forEach((key) => {
                if (!excludedKeys.includes(key)) {
                    newItem[key] = item[key];
                }
            });
            return newItem;
        });
    }
    return formattedData;
};




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
        data: combinedData,
        start_time: startDate.format('YYYY-MM-DD HH:mm:ss'),
        end_time: endDate.format('YYYY-MM-DD HH:mm:ss'),
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

      const sortedData = sortDataByTime(responseData);

     
      const formattedList = formatDataList(sortedData);
      console.log(formattedList)
      setData(formattedList);
      if (currentMeasurement){
        const cur = currentMeasurement
        setCurrentMeasurement(cur)
      }
      else{
        setCurrentMeasurement(Object.keys(formattedList)[0])
      }
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
    console.log(index,editIndex,data[currentMeasurement],selectedMeasurement,currentMeasurement)

    if (editIndex === null) {
      console.error("No item selected for update");
      return;
    }
    // Assuming the data item has a 'time' field to identify it.
    // This part might need adjustment based on your data structure.
    const itemToUpdate = data[currentMeasurement][editIndex];
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
    return data.length > 0 || Object.keys(data).length !== 0 ? (
      data[currentMeasurement].map((item, index) => (
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
      ))
    ) : null;
  };

  const handleUpdate2 = (newData) => {
    setCombinedData(newData);
};


return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: 2 }}>
      <Typography variant="h6">Data Editor</Typography>
      <Grid container spacing={2}>
        {/* Range, Measurement Selection, and Tag Filters remain the same */}
        <DateTimeForm
              initialStartDate={startDate}
              initialEndDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              currentTime={currentTime}
            />
        <Grid item xs={12}>

        <DynamicDropdownMenu
          onUpdate={handleUpdate2}
          startDate={startDate}
          endDate={endDate}
        />
          <Button onClick={fetchData} variant="contained" color="primary" sx={{ mt: 2 }}>
            Fetch Data
          </Button>
        </Grid>
      </Grid>

      <div>
      <ButtonGroup variant="contained" aria-label="outlined primary button group">
        {data.length > 0 || Object.keys(data).length !== 0 && Object.keys(data).map(measurement => (
          <Button key={measurement} onClick={() => handleMeasurementChange(measurement)}>
            {measurement}
          </Button>
        ))}
      </ButtonGroup>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Measurement</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableRows()}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
    </Box>

  );
};

export default DataEditor;