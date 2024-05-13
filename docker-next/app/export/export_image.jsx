import React from 'react';
import { Button } from '@mui/material';

const ExportButton = ({ chartRef }) => {
  const exportChart = () => {
    if (chartRef.current) {
      const chart = chartRef.current;

      // Temporarily enable the legend
      const originalLegendDisplay = chart.options.plugins.legend.display;
      chart.options.plugins.legend.display = true;
      chart.update();

      // Export the chart as a base64 image
      const url = chart.toBase64Image();

      // Reset the legend back to its original state
      chart.options.plugins.legend.display = originalLegendDisplay;
      chart.update();

      // Create a download link for the exported image
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart-export.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Button className="custom-button1" onClick={exportChart} style={{ width: '100%' }}>
      Export Chart
    </Button>
  );
};

export default ExportButton;
