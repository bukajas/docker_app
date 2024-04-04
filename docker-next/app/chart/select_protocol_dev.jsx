import { useState, useEffect, useRef} from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
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
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Measurements() {
  const [measurements, setMeasurements] = useState({});
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [range, setRange] = useState('');
  const [tagFilters, setTagFilters] = useState({});
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState({});
  
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
    <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography variant="h6" component="div">
            {selectedMeasurement ? `Chart for ${selectedMeasurement}` : 'Select a Measurement'}
          </Typography>
          {chartData.labels && (
            <Box sx={{ mt: 2 }}>
              <Line data={chartData} options={options} ref={chartRef} />
            </Box>
          )}
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
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
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
              Submit
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Measurements;