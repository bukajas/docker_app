import React, { useState } from 'react';
import ChartComponent from './chart_component'; // Replace with the correct path to your ChartComponent
import { Button } from '@mui/material';
import ChartComponent2 from './new_chart'; // Replace with the correct path to your ChartComponent


function ChartContainer() {
  const [charts, setCharts] = useState([]);

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
      <Button variant="contained" color="primary" onClick={handleCreateChart}>
        Create Chart
      </Button>
      {charts.map(chartId => (
        <ChartComponent2
          key={chartId}
          measurementId={chartId}
          handleDelete={handleDeleteChart}
        />
      ))}
    </div>
  );
}

export default ChartContainer;
