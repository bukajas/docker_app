import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import DateTimeForm from '../components/Time_component_chart'
import DynamicDropdownMenu from '../components/Selection_component'
import dayjs from 'dayjs';
import RightDrawer from '../components/Drawer_settings'
import { stringToDictionary } from '../components/Functions'
import ExportButton from '../export/export_image';
import { Chart, registerables } from 'chart.js';
import '../../styles.css';

function convertDictToString(dict) {
  const keysToExclude = ['date', 'day', '_start', '_stop', '_time', "result", "table", "time", "_value"];

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
  const [mode, setMode] = useState('relative');
  const [rightDrawerSignal, setRightDrawerSignal] = useState(new Date().getTime());
  const [chartOptions, setChartOptions] = useState({});
  // Refs to hold the current state values
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);

  // Update refs whenever state changes
  useEffect(() => {
    startDateRef.current = startDate;
    endDateRef.current = endDate;
  }, [startDate, endDate]);

  const chartRef = useRef(null);

  useEffect(() => {
    // Update itemsToDisplay based on whether selectionFromDrawer is empty
    if (selectionsFromDrawer.length > 0) {

      const dict = {};
      selectionsFromDrawer.map((value, index) => {
        const jsonObject = JSON.parse(value);
        delete jsonObject.result;
        jsonObject['measurement'] = jsonObject['_measurement'];
        delete jsonObject['_measurement'];

        dict[value] = jsonObject;
      });

      setItemsToDisplay(dict);

    } else {
      const dict = {};
      dataKeys.map((value, index) => {

        const validJsonString = value.replace(/'/g, '"');

        // Parse the JSON string into an object
        const jsonObject = JSON.parse(validJsonString);
        delete jsonObject.result;
        jsonObject['measurement'] = jsonObject['_measurement'];
        delete jsonObject['_measurement'];

        dict[value] = jsonObject;
      });
      setItemsToDisplay(dict);
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
      const id = setInterval(handleSubmit, 1000); // Pass handleSubmit reference
      setIntervalId(id);
      return () => clearInterval(id);
    } else {
      clearInterval(intervalId); // Clear interval when fetchEnabled is false
    }
  }, [fetchEnabled]);

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

      // Object to store unique Y-axis IDs for each measurement
      const yAxisIds = {};

      // Iterate over each key in the filtered data object
      Object.keys(filteredData).forEach((key, index) => {
        const datasetData = filteredData[key].map((d) => d._value);
        const datasetLabel = filteredData[key][index]; // Assuming all data points in the same key have the same measurement
        const resultString = convertDictToString(filteredData[key][index]);

        // Determine the Y-axis ID for this measurement
        const measurement = filteredData[key][index]._measurement;
        if (!yAxisIds[measurement]) {
          yAxisIds[measurement] = `y-axis-${Object.keys(yAxisIds).length + 1}`;
        }

        // Prepare the dataset
        const dataset = {
          label: resultString,
          data: datasetData,
          fill: false,
          borderColor: colors[index % colors.length], // Use modulo to loop through the colors array
          backgroundColor: colors[index % colors.length],
          tension: 0.1,
          yAxisID: yAxisIds[measurement], // Assign the Y-axis ID
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

      // Define multiple scales in the options
      const scales = {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        ...Object.keys(yAxisIds).reduce((acc, measurement, index) => {
          acc[yAxisIds[measurement]] = {
            type: 'linear',
            display: true,
            position: index % 2 === 0 ? 'left' : 'right', // Alternate left and right positions for Y-axes
          };
          return acc;
        }, {}),
      };

      setChartOptions({
        animation: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales,
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
      });

    }
  }, [data, selectedMeasurement, selectedDataKey]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      setRightDrawerSignal(new Date().getTime());  // You can pass any data here
      setSelectionsFromDrawer([])
      const body1 = {
        data: combinedData,
        start_time: startDateRef.current.format('YYYY-MM-DD HH:mm:ss'),
        end_time: endDateRef.current.format('YYYY-MM-DD HH:mm:ss'),
      }
      const token = localStorage.getItem('token');
      const response = await fetch('https://localhost:8000/read_data_dynamic', {
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
      setCurrentTime(dayjs());

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit2 = async (e) => {
    if (e) e.preventDefault();

    try {
      setSelectedDataKey([])
      setRightDrawerSignal(new Date().getTime());  // You can pass any data here
      setSelectionsFromDrawer([])
      const body1 = {
        data: combinedData,
        start_time: startDateRef.current.format('YYYY-MM-DD HH:mm:ss'),
        end_time: endDateRef.current.format('YYYY-MM-DD HH:mm:ss'),
      }
      const token = localStorage.getItem('token');
      const response = await fetch('https://localhost:8000/read_data_dynamic', {
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
      setCurrentTime(dayjs());

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleDataKeyToggle = (value) => {
    setSelectedDataKey(value);
  };

  const footer = (tooltipItems) => {
    let sum = 0;
    tooltipItems.forEach(function (tooltipItem) {
      sum += tooltipItem.parsed.y;
    });
    return 'Sum: ' + sum;
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
        Object.entries(newSelections[ye]).forEach(([subKey, value]) => {
          if (!(subKey in dict) || !value.includes(dict[subKey])) {
            allSubKeysPresent = false;
          }
        })
        if (allSubKeysPresent) {
          matchedDicts.push(JSON.stringify(dict));
        }
      }
    });

    setSelectionsFromDrawer(matchedDicts)
  };

  return (
    <Box className="wrapper" sx={{ flexGrow: 1, bgcolor: 'background.paper', width: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" component="div">
            {selectedMeasurement ? `Chart for ${selectedMeasurement}` : 'Select a Measurement'}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <Button
                  className="custom-button"
                  onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
                  variant="contained"
                  color="primary"
                  sx={{
                    mt: 0,
                    mb: 0,
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}
                >
                  {chartType === 'line' ? 'Switch to Bar Chart' : 'Switch to Line Chart'}
                </Button>

                <Button
                  className="export-aggregated-button"
                  variant="contained"
                  color="secondary"
                  sx={{
                    mt: 0,
                    mb: 0,
                    backgroundColor: 'secondary.main',
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
                    }
                  }}
                  onClick={() => handleDelete(measurementId)}
                >
                  Delete This Chart
                </Button>

                <ExportButton chartRef={chartRef} sx={{ mt: 0, mb: 0 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <DateTimeForm
                initialStartDate={startDate}
                initialEndDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                currentTime={currentTime}
                mode={mode}
                setMode={setMode}
              />
              {mode === 'absolute' ? (
                <>
                </>) : (
                <Button onClick={toggleFetchEnabled} style={{ width: '100%', background: fetchEnabled ? 'lightgreen' : 'lightgrey' }}>
                  {fetchEnabled ? 'Disable Fetching' : 'Enable Fetching'}
                </Button>
              )}
            </Grid>
          </Grid>

          {chartData.labels && (
            <Box sx={{ mt: 2 }}>
              {chartType === 'line' ? (
                <Line ref={chartRef} data={chartData} options={chartOptions} />
              ) : (
                <Bar ref={chartRef} data={chartData} options={chartOptions} />
              )}
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={8}>
          <p>Available values:</p>
          {data ? (
            <RightDrawer
              data={data}
              onSelectionsChange={handleSelectionsChange}
              signal={rightDrawerSignal}
            />
          ) : (
            <></>
          )}
          <ToggleButtonGroup
            orientation="vertical"
            value={selectedDataKey}
            onChange={(event, value) => handleDataKeyToggle(value)}
            aria-label="data keys"
            sx={{ mt: 2 }}
          >
            {Object.keys(itemsToDisplay).map((key, index) => (
              <ToggleButton key={index} value={key} aria-label={key}>
                {JSON.stringify(itemsToDisplay[key]).replace(/[{}"]/g, ' ')}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <p>Select measurement and submit</p>
            </Grid>
            <Grid item>
              <Button className="custom-button" type="submit" variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSubmit2}>
                Submit
              </Button>
            </Grid>
          </Grid>
          <DynamicDropdownMenu
            onUpdate={handleUpdate}
            startDate={startDate}
            endDate={endDate}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default ChartComponent2;
