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
  List,
  ListItem,
  Paper,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

function ChartComponent({ measurementId, handleDelete }) {
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [range, setRange] = useState('');
  const [tagFilters, setTagFilters] = useState({});
  const [chartData, setChartData] = useState({});
  const [data, setData] = useState(null);
  const [measurements, setMeasurements] = useState({});


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


  const handleTagFilterChange = (tag, value) => {
    setTagFilters((prevFilters) => ({ ...prevFilters, [tag]: value }));
  };



  useEffect(() => {
    if (data) {
      const labels = data.map(d => d.time);
      const dataValues = data.map(d => d.value);
      setChartData({
        labels,
        datasets: [
          {
            label: `${selectedMeasurement}`,
            data: dataValues,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      });
    }
  }, [data, selectedMeasurement]);




  const handleSubmit = async (e) => {
    e.preventDefault();

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
          tag_filters: tagFilters,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData)
      setData(responseData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  
  const options = {
    animation: false,
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
            <TextField
              label="Range (minutes)"
              variant="outlined"
              fullWidth
              value={range}
              onChange={(e) => setRange(e.target.value)}
              sx={{ mt: 2 }}
            />
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
    </Box>
  );
}

export default ChartComponent;