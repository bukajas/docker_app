import React, { useState, useRef,  useEffect } from 'react';
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
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

function ChartComponent({ measurementId, handleDelete }) {
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [range, setRange] = useState('');
  const [tagFilters, setTagFilters] = useState({});
  const [chartData, setChartData] = useState({});
  const [data, setData] = useState(null);
  const [measurements, setMeasurements] = useState({});
  const [dataKeys, setDataKeys] = useState([]);  // State to hold keys from fetched data
  const [selectedDataKey, setSelectedDataKey] = useState([]);
  const [rangeUnit, setRangeUnit] = useState('minutes'); // Default value is minutes
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [useMinutesAgo, setUseMinutesAgo] = useState(false);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [intervalId, setIntervalId] = useState(null); // State to store interval ID


  const chartRef = useRef(null);
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


  useEffect(() => {
    // Toggle periodic fetching when fetchEnabled state changes
    if (fetchEnabled) {
      const id = setInterval(handleSubmit, 5000); // Fetch data every 2 seconds
      setIntervalId(id);
    } else {
      clearInterval(intervalId); // Clear interval when fetchEnabled is false
      setIntervalId(null);
    }
  }, [fetchEnabled]);


  useEffect(() => {
    (handleSubmit); // Initial fetch and refetch when selectedDataTypes or hoursAgo changes

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [selectedMeasurement,range,fromTime,toTime]);

  const toggleFetchEnabled = () => {
    setFetchEnabled(prevState => !prevState); // Toggle fetchEnabled state
  };


  const handleTagFilterChange = (tag, value) => {
    setTagFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
  };



  useEffect(() => {
    if (data) {
      // Prepare labels and datasets
      const labels = [];
      const datasets = [];
    
      // Filter data based on selected keys
      const filteredData = {};
      selectedDataKey.forEach((key) => {
        filteredData[key] = data[key];
      });
    
      // Array of predefined colors
      const colors = ['rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 205, 86)', 'rgb(153, 102, 255)']; // Add more colors as needed
    
      // Iterate over each key in the filtered data object

      Object.keys(filteredData).forEach((key, index) => {
        const datasetData = filteredData[key].map((d) => d._value);
        const datasetLabel = filteredData[key][0]._measurement; // Assuming all data points in the same key have the same measurement
        
        // Prepare the dataset
        const dataset = {
          label: datasetLabel,
          data: datasetData,
          fill: false,
          borderColor: colors[index % colors.length], // Use modulo to loop through the colors array
          tension: 0.1,
        };
    
        // Add the dataset to the datasets array
        datasets.push(dataset);
    
        // Assuming all datasets have the same labels (time), you can extract them once
        if (labels.length === 0) {
          labels.push(...filteredData[key].map((d) => d.time));
        }
      });
    
      // Set the chart data
      setChartData({
        labels,
        datasets,
      });
    }
  }, [data, selectedMeasurement, selectedDataKey]);
  




  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/read_data_dynamic', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurement: selectedMeasurement,
          range,
          interval: rangeUnit,
          tag_filters: tagFilters,
          start_time: fromTime,
          end_time: toTime,
        }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const responseData = await response.json();
      //TODO filter and save specific values
      const sortedData = {};
      Object.keys(responseData.data).forEach((key) => {
        // Sort the list for the current key based on the _time field
        sortedData[key] = responseData.data[key].sort((a, b) => {
          return new Date(a._time) - new Date(b._time);
        });
      });

        setData(sortedData);
        const keys = Object.keys(responseData.data);
        setDataKeys(keys);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };



  const handleDataKeyToggle = (value) => {
    setSelectedDataKey(value);
    // if (value.length > 0) {
    //   value.forEach((key) => {
    //     console.log('Clicked data key:', key);
    //     console.log('Data value:', data[key]);
    //   });
    // }
  };

  const footer = (tooltipItems) => {
    let sum = 0;
  
    tooltipItems.forEach(function(tooltipItem) {
      sum += tooltipItem.parsed.y;
    });
    return 'Sum: ' + sum;
  };
  
  const options = {
    animation: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          footer: footer,
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'xy'
        }
      },
      legend: {
        display: false, // Hides the legend
      },
    },
  };
  

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
      setRange('');
    }
  };


  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography variant="h6" component="div">
            {selectedMeasurement ? `Chart for ${selectedMeasurement}` : 'Select a Measurement'}
          </Typography>
          {chartData.labels && (
            <Box sx={{ mt: 2 }}>
              <Line data={chartData} options={options} />
            </Box>
          )}
        </Grid>
        <Grid item xs={4}>
        <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="measurement-select-label">Measurement</InputLabel>
            <Select
              labelId="measurement-select-label"
              id="measurement-select"
              value={selectedMeasurement}
              label="Measurement"
              onChange={(e) => setSelectedMeasurement(e.target.value)}
            >
              {Object.keys(measurements).map((measurement) => (
                <MenuItem key={measurement} value={measurement}>
                  {measurement}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Paper style={{ maxHeight: 400, overflow: 'auto' }} component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
              Submit
            </Button>

            
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
                     <Button onClick={toggleFetchEnabled} style={{ marginLeft: '10px', background: fetchEnabled ? 'lightgreen' : 'lightgrey' }}>
                      {fetchEnabled ? 'Disable Fetching' : 'Enable Fetching'}
                    </Button>
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
          </Paper>
          
        </Grid>
      </Grid>
      <Button variant="contained" color="secondary" onClick={() => handleDelete(measurementId)}>
        Delete This Chart
      </Button>
        <ToggleButtonGroup
          value={selectedDataKey}
          onChange={(event, value) => handleDataKeyToggle(value)}
          aria-label="data keys"
        >
        {dataKeys.map((key, index) => (
          <ToggleButton key={index} value={key} aria-label={key}>
            {key}
          </ToggleButton>
        ))}
</ToggleButtonGroup>
    </Box>
  );
}

export default ChartComponent;