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
import DateTimeForm from '../components/Time_component'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DynamicDropdownMenu from '../components/Selection_component'
import dayjs from 'dayjs';
import RightDrawer from '../components/Drawer_settings'
import { constructNow } from 'date-fns';




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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeFrameSubmitted, setTimeFrameSubmitted] = useState(false);
  const [combinedData, setCombinedData] = useState({})
  const [selectionsFromDrawer, setSelectionsFromDrawer] = useState({});


  const chartRef = useRef(null);

  useEffect(() => {
    // Assume you fetch the initial date from an API or calculate it
    const initialStart = dayjs();
    const initialEnd = dayjs().add(1, 'hour');
    setStartDate(initialStart);
    setEndDate(initialEnd);
  }, []); // Empty dependency array ensures this runs only once on mount

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
    if (startDate && endDate || range) {
      setTimeFrameSubmitted(true);
    } else {
      setTimeFrameSubmitted(false);
    }
  }, [startDate, endDate, range]); // Dependencies on time inputs
  
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
          labels.push(...filteredData[key].map((d) => d.day));
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
          data: combinedData,
          start_time: startDate.format('YYYY-MM-DD HH:mm:ss'),
          end_time: endDate.format('YYYY-MM-DD HH:mm:ss'),
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

  const handleUpdate = (newData) => {
    setCombinedData(newData);
    console.log("Updated Combined Data:", JSON.stringify(newData));
};

const handleSelectionsChange = (newSelections) => {
  setSelectionsFromDrawer(newSelections);
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

          <DateTimeForm
              initialStartDate={startDate}
              initialEndDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          {timeFrameSubmitted && (
              <>
        <DynamicDropdownMenu
          onUpdate={handleUpdate}
          startDate={startDate}
          endDate={endDate}
        />
      </>
      )}
          <Paper component="form" onSubmit={handleSubmit}>
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
              Submit
            </Button>
            <RightDrawer
              data={data}
              onSelectionsChange={handleSelectionsChange}
            />
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
      <p>Start Date: {startDate ? startDate.format('YYYY-MM-DD HH:mm:ss') : 'Not set'}</p>
      <p>End Date: {endDate ? endDate.format('YYYY-MM-DD HH:mm:ss') : 'Not set'}</p>

  
    </Box>
  );
}

export default ChartComponent;