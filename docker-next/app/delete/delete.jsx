import React, { useState, useEffect } from 'react';
import { TextField, Button, FormControl, Box, RadioGroup} from '@mui/material';
import DynamicDropdownMenu from '../components/Selection_component'
import dayjs from 'dayjs';
import DateTimeForm from '../components/Time_component'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import '../../styles.css';



const DeleteDataForm = () => {
  // State variables to manage form inputs and state
  const [timeOption, setTimeOption] = useState('minutes');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [range, setRange] = useState('');
  const [timeFrameSubmitted, setTimeFrameSubmitted] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [combinedData, setCombinedData] = useState({})
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const apiUrl = 'https://127.0.0.1:8000/delete_data';
    // Combine date and time for start and end times
    const body = {
      data: combinedData,
      start_time: startDate.format('YYYY-MM-DD HH:mm:ss'),
      end_time: endDate.format('YYYY-MM-DD HH:mm:ss'),
    };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://localhost:8000/delete_data', {
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

  
  

  
  // Monitor changes in time inputs to enable or disable form submission
  useEffect(() => {
    if (fromTime && toTime || range) {
      setTimeFrameSubmitted(true);
    } else {
      setTimeFrameSubmitted(false);
    }
  }, [fromTime, toTime, range]); // Dependencies on time inputs

    // Handle updates from the DynamicDropdownMenu
  const handleUpdate = (newData) => {
    setCombinedData(newData);
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Example primary color
    },
    secondary: {
      main: '#dc3545', // Example secondary color
    },
  },
});


  return (
    <ThemeProvider theme={theme}>

    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      
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
      <DynamicDropdownMenu
          onUpdate={handleUpdate}
          startDate={startDate}
          endDate={endDate}
        />
      <Button className="delete-button" type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Delete Data
      </Button>
    </Box>
    </ThemeProvider>
  );
};

export default DeleteDataForm;
