// ExportButton.js
import React from 'react';
import { Button} from '@mui/material';
const ExportButton = ({ chartRef }) => {
  const exportChart = () => {
    if (chartRef.current) {
        const url = chartRef.current.toBase64Image(); // Directly use chartRef.current
        const link = document.createElement('a');
        link.href = url;
        link.download = 'chart-export.png'; // Set the download name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
  return (
    <Button onClick={exportChart} style={{ marginTop: '10px' }}>Export Chart</Button>
    
  );
};

export default ExportButton;
