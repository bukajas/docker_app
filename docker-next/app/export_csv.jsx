import React, { useState } from 'react';
import axios from 'axios';
import FileDownload from 'js-file-download';

const DataExportForm = () => {
  const [measurement, setMeasurement] = useState('');
  const [field, setField] = useState('');
  const [slaveID, setSlaveID] = useState('');
  const [masterID, setMasterID] = useState('');
  const [modbusType, setModbusType] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [minutesAgo, setMinutesAgo] = useState('');

  const handleNow = () => {
    const now = new Date().toISOString().slice(0, 16); // ISO string trims to match input format
    setFromTime(now);
    setToTime(now);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Calculate time range from minutes ago if provided
      let computedFromTime = fromTime;
      let computedToTime = toTime;
      if (minutesAgo) {
        const now = new Date();
        const from = new Date(now - minutesAgo * 60000); // Convert minutes to milliseconds
        computedFromTime = from.toISOString().slice(0, 16);
        computedToTime = now.toISOString().slice(0, 16);
      }
      console.log(computedFromTime, computedToTime)
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/export_csv', {
        params: { 
          measurement, 
          field, 
          slaveID, 
          masterID, 
          modbusType, 
          fromTime: computedFromTime, 
          toTime: computedToTime 
        },
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      FileDownload(response.data, 'export.csv');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={measurement} onChange={(e) => setMeasurement(e.target.value)} placeholder="Measurement" />
      <input type="text" value={field} onChange={(e) => setField(e.target.value)} placeholder="Field" />
      <input type="text" value={slaveID} onChange={(e) => setSlaveID(e.target.value)} placeholder="Slave ID" />
      <input type="text" value={masterID} onChange={(e) => setMasterID(e.target.value)} placeholder="Master ID" />
      <input type="text" value={modbusType} onChange={(e) => setModbusType(e.target.value)} placeholder="Modbus Type" />
      <input type="datetime-local" value={fromTime} onChange={(e) => setFromTime(e.target.value)} placeholder="From Time" />
      <input type="datetime-local" value={toTime} onChange={(e) => setToTime(e.target.value)} placeholder="To Time" />
      <input type="number" value={minutesAgo} onChange={(e) => setMinutesAgo(e.target.value)} placeholder="Minutes from Now" />
      <button type="button" onClick={handleNow}>Now</button>
      <button type="submit">Export Data</button>
    </form>
  );
};

export default DataExportForm;
