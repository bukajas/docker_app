import React, { useState } from 'react';
import ChartComponent2 from './new_chart'; // Adjust the path as necessary
import { Button, SpeedDial, SpeedDialIcon, SpeedDialAction } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add'; // Icon for the speed dial
import '../../styles.css';


function ChartContainer() {
  const [charts, setCharts] = useState([]);
  const [open, setOpen] = useState(false); // State to handle the opening of the Speed Dial

  const handleCreateChart = () => {
    // Generate a unique ID for the key prop
    const newChartId = Math.random().toString(36).substr(2, 9);
    setCharts(charts.concat(newChartId));
  };

  const handleDeleteChart = (chartId) => {
    setCharts(charts.filter(id => id !== chartId));
  };



  return (
    <div>
      <Button className="export-button" variant="contained" color="primary" onClick={handleCreateChart}>
        Create Chart
      </Button>
      {charts.map(chartId => (
        <ChartComponent2
          key={chartId}
          measurementId={chartId}
          handleDelete={handleDeleteChart}
        />
      ))}
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateChart}
        open={open}
      >
      </SpeedDial>
    </div>
  );
}

export default ChartContainer;
