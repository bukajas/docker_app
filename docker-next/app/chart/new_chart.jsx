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
import { Line,Bar } from 'react-chartjs-2';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import DateTimeForm from '../components/Time_component'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DynamicDropdownMenu from '../components/Selection_component'
import dayjs from 'dayjs';
import RightDrawer from '../components/Drawer_settings'
import { constructNow, isLeapYear } from 'date-fns';
import {stringToDictionary,aggregateDataDynamically} from '../components/Functions'
import { convertFieldResponseIntoMuiTextFieldProps } from '@mui/x-date-pickers/internals';
import ExportButton from '../export/export_image';
import { Chart, registerables } from 'chart.js';



function convertDictToString(dict) {
  const keysToExclude = ['date', 'day', '_start', '_stop', '_time',"result","table","time","_value"];

  // Convert dictionary to a string but exclude certain keys
  return Object.entries(dict)
    .filter(([key, _]) => !keysToExclude.includes(key))  // Exclude specified keys
    .map(([key, value]) => `${key}:${value}`)           // Format each key-value pair
    .join(',');                                         // Join pairs with commas
}

Chart.register(...registerables);

function ChartComponent2({ measurementId, handleDelete }) {
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [chartData, setChartData] = useState({});
  const [data, setData] = useState(null);
  const [dataKeys, setDataKeys] = useState([]);  // State to hold keys from fetched data
  const [selectedDataKey, setSelectedDataKey] = useState([]);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [intervalId, setIntervalId] = useState(null); // State to store interval ID
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeFrameSubmitted, setTimeFrameSubmitted] = useState(false);
  const [combinedData, setCombinedData] = useState({})
  const [selectionsFromDrawer, setSelectionsFromDrawer] = useState([]);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [chartType, setChartType] = useState('line');
  const [itemsToDisplay, setItemsToDisplay] = useState([]);



  const chartRef = useRef(null);


  useEffect(() => {
    // Update itemsToDisplay based on whether selectionFromDrawer is empty
    if (selectionsFromDrawer.length > 0) {
      setItemsToDisplay(selectionsFromDrawer);
    } else {
      setItemsToDisplay(dataKeys);
    }
  }, [dataKeys, selectionsFromDrawer]); // Dependencies ensure this effect runs when either prop changes


  useEffect(() => {
    // Assume you fetch the initial date from an API or calculate it
    const initialStart = dayjs();
    const initialEnd = dayjs().add(1, 'hour');
    setStartDate(initialStart);
    setEndDate(initialEnd);
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {

    if (fetchEnabled) {
      const id = setInterval(handleSubmit(), 5000); // Fetch data every 2 seconds
      setIntervalId(id);
      return () => clearInterval(id);
    } else {
      clearInterval(intervalId); // Clear interval when fetchEnabled is false
      // setIntervalId(null);
    }

  }, [fetchEnabled,currentTime]);


  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(dayjs());
  //   }, 3000);
  //   return () => clearInterval(timer);
  // }, []);


  const toggleFetchEnabled = () => {
    setFetchEnabled(prevState => !prevState); // Toggle fetchEnabled state
  };
  
  useEffect(() => {
    if (startDate && endDate) {
      setTimeFrameSubmitted(true);
    } else {
      setTimeFrameSubmitted(false);
    }
  }, [startDate, endDate]); // Dependencies on time inputs
  
  useEffect(() => {
    if (data) {
      // Prepare labels and datasets
      const labels = [];
      const datasets = [];
    
      // Filter data based on selected keys
      const filteredData = {};
      selectedDataKey.forEach((key) => {
        let jsonString = JSON.stringify(key);
        let modifiedString = jsonString.slice(1, -1).replace(/: /g, ":").replace(/, /g, ",").replace(/"/g, "'").replace(/\\/g, "").replace(/,/g, ", ").replace(/:/g, ": ");

        filteredData[key] = data[modifiedString];
      });

      // Array of predefined colors
      const colors = ['rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 205, 86)', 'rgb(153, 102, 255)']; // Add more colors as needed
    
      // Iterate over each key in the filtered data object

      Object.keys(filteredData).forEach((key, index) => {
        const datasetData = filteredData[key].map((d) => d._value);
        const datasetLabel = filteredData[key][index]; // Assuming all data points in the same key have the same measurement
        const resultString = convertDictToString(filteredData[key][index]);
        console.log(resultString)
        // Prepare the dataset
        const dataset = {
          label: resultString,
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
      const body1 = {
        data: combinedData,
        start_time: startDate.format('YYYY-MM-DD HH:mm:ss'),
        end_time: endDate.format('YYYY-MM-DD HH:mm:ss'),
      }
      console.log(body1)
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/read_data_dynamic', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body1),
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
        // setSelectionsFromDrawer(keys)
        setCurrentTime(dayjs());

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleDataKeyToggle = (value) => {
    console.log("datakeytoggle")
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
};


const handleSelectionsChange = (newSelections) => {

  const dictionary = stringToDictionary(dataKeys);
  const topLevelKeys = Object.keys(newSelections);
  let matchedDicts = [];
  dictionary.forEach(dict => {
    if (topLevelKeys.includes(dict._measurement)) {
      let ye = dict._measurement
      let allSubKeysPresent = true;
      Object.entries(newSelections[ye]).forEach(([subKey,value]) =>{
        if (!(subKey in dict) || !value.includes(dict[subKey])) {
          allSubKeysPresent = false;
        }
      })
      if (allSubKeysPresent) {
        matchedDicts.push(JSON.stringify(dict));
      }
    }
  });
  console.log(matchedDicts)
  console.log(dataKeys)
  setSelectionsFromDrawer(matchedDicts)
  setSelectedDataKey([]);
};




return (
  <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: 2, mb: 2 }}>
    <Grid container spacing={2}>
      {/* Full-width chart at the top */}
      <Grid item xs={12}>
        <Typography variant="h6" component="div">
          {selectedMeasurement ? `Chart for ${selectedMeasurement}` : 'Select a Measurement'}
        </Typography>
        <Button onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')} variant="contained" color="primary" sx={{ mt: 2, mr: 2 }}>
          {chartType === 'line' ? 'Switch to Bar Chart' : 'Switch to Line Chart'}
        </Button>
        {chartData.labels && (
          <Box sx={{ mt: 2 }}>
            {chartType === 'line' ? (
              <Line ref={chartRef} data={chartData} options={options} />
            ) : (
              <Bar ref={chartRef} data={chartData} options={options} />
            )}
          </Box>
        )}
      </Grid>
      {/* Left column for DateTimeForm, toggle buttons, etc. */}
      <Grid item xs={12} md={8}>
        <DateTimeForm
          initialStartDate={startDate}
          initialEndDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          currentTime={currentTime}
        />
        <Button onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')} variant="contained" color="primary" sx={{ mt: 2 }}>
          {chartType === 'line' ? 'Switch to Bar Chart' : 'Switch to Line Chart'}
        </Button>
        <Button onClick={toggleFetchEnabled} style={{ marginLeft: '10px', background: fetchEnabled ? 'lightgreen' : 'lightgrey' }}>
          {fetchEnabled ? 'Disable Fetching' : 'Enable Fetching'}
        </Button>
        <Button variant="contained" color="secondary" sx={{ mt: 2 }} onClick={() => handleDelete(measurementId)}>
          Delete This Chart
        </Button>
        <ExportButton chartRef={chartRef} />
      </Grid>
      {/* Right column for DynamicDropdownMenu, itemsToDisplay, and submit button */}
      <Grid item xs={12} md={4}>
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSubmit}>
          Submit
        </Button>
        <DynamicDropdownMenu
          onUpdate={handleUpdate}
          startDate={startDate}
          endDate={endDate}
        />
        <RightDrawer
              data={data}
              onSelectionsChange={handleSelectionsChange}
            />
        <ToggleButtonGroup
          orientation="vertical"
          value={selectedDataKey}
          onChange={(event, value) => handleDataKeyToggle(value)}
          aria-label="data keys"
          sx={{ mt: 2 }}
        >
          {itemsToDisplay.map((key, index) => (
            <ToggleButton key={index} value={key} aria-label={key}>
              {key}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

      </Grid>
    </Grid>
  </Box>
);
}

export default ChartComponent2;