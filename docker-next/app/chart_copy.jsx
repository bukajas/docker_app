"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { ResizableBox } from 'react-resizable';
import ExportButton from './export_image';
import 'react-resizable/css/styles.css'; // Import CSS for react-resizable

Chart.register(...registerables);

const LineChartPage = () => {
  const [apiData, setApiData] = useState({});
  const [hoursAgo, setHoursAgo] = useState(1);
  const [selectedDataTypes, setSelectedDataTypes] = useState([]);
  const [dataPointsLimit, setDataPointsLimit] = useState(20);
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [intervalId, setIntervalId] = useState(null); // State to store interval ID
  const [slaveId, setSlaveId] = useState(0);
  const [masterId, setMasterId] = useState(1);
  const [modbusType, setModbusType] = useState(1);
  const [dataTypes, setDataTypes] = useState([]);

  // const dataTypes = ['coil_list', 'temperature_list']; // Available data types


  const chartRef = useRef(null);

  useEffect(() => {
    fetchData(); // Initial fetch and refetch when selectedDataTypes or hoursAgo changes

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [selectedDataTypes, hoursAgo, slaveId, masterId, modbusType]);

  useEffect(() => {
    fetchDataTypes();
  }, [slaveId, masterId, modbusType]);

  useEffect(() => {
    // Toggle periodic fetching when fetchEnabled state changes
    if (fetchEnabled) {
      const id = setInterval(fetchData, 5000); // Fetch data every 2 seconds
      setIntervalId(id);
    } else {
      clearInterval(intervalId); // Clear interval when fetchEnabled is false
      setIntervalId(null);
    }
  }, [fetchEnabled]);

  const toggleFetchEnabled = () => {
    setFetchEnabled(prevState => !prevState); // Toggle fetchEnabled state
  };

  const fetchDataTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/filtered_measurements_with_fields?slaveID=${slaveId}&masterID=${masterId}&modbusType=${modbusType}`, {
        method: 'GET', // Assuming your endpoint is a GET request
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const jsonData = await response.json();
        const measurements = Object.keys(jsonData.measurements_with_fields);
        setDataTypes(measurements);
      } else {
        console.error('Error fetching data types:', response.status);
        setDataTypes([]); // Reset if there's an error or no types found
      }
    } catch (error) {
      console.error('Error fetching data types:', error);
      setDataTypes([]); // Reset on error
    }
  };

  async function fetchData() {
    const requestBodyForEachDataType = selectedDataTypes.map((dataType) => {
      let data = ''; // Initialize subDataType
      // Assign subDataType based on the dataType
      if (dataType === 'coil_list') {
        data = 'coils';
      } else if (dataType === 'temperature_list') {
        data = 'temperature';
      }
  
      return {
        range: hoursAgo * 60, // Convert hours to minutes
        dataType: dataType,
        data: data, // Add subDataType to the request body
        slaveId: slaveId,
        masterId: masterId,
        modbusType: modbusType
      };
    });
    console.log(requestBodyForEachDataType)
    const promises = requestBodyForEachDataType.map(async (requestBody) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/read_data`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        if (response.ok) {
          const jsonData = await response.json();
          return { dataType: requestBody.dataType, data: jsonData.data };
        } else {
          console.error('Error fetching data:', response.status);
          return null;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    });
  
    Promise.all(promises).then((results) => {
      const newData = results.reduce((acc, result) => {
        if (result) {
          acc[result.dataType] = result.data;
        }
        return acc;
      }, {});
      setApiData(newData);
    });
  }
  

  useEffect(() => {
    fetchData(); // Initial fetch and refetch when selectedDataTypes or hoursAgo changes
  }, [selectedDataTypes, hoursAgo]);

  const toggleDataType = (dataType) => {
    setSelectedDataTypes((prev) =>
      prev.includes(dataType) ? prev.filter((dt) => dt !== dataType) : [...prev, dataType]
    );
  };

  // Add a function to toggle slaveId
  const toggleSlaveId = (id) => {
    setSlaveId(id);
  };

  // Add a function to toggle masterId
  const toggleMasterId = (id) => {
    setMasterId(id);
  };

  // Add a function to toggle modbusType
  const toggleModbusType = (type) => {
    setModbusType(type);
  };



  

  const generateChartData = () => {
    let allLabels = []; // This will hold all possible labels
    const datasets = selectedDataTypes.map((dataType, index) => {
      const dataPoints = apiData[dataType] || [];
      let values = [];
      let times = [];
  
      if (dataPoints.length) {
        values = dataPoints.map(dp => dp.value);
        times = dataPoints.map(dp => {
          const date = new Date(dp.time);
          return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'});
        });
  
        // Update allLabels if this dataType provides more recent times
        if (times.length > allLabels.length) {
          allLabels = times.slice(-dataPointsLimit);
        }
      }
  
      return {
        label: `${dataType.replace('_list', '')} Value`, // Clean up dataType for label
        data: values.slice(-dataPointsLimit),
        borderColor: `rgba(${75 + index * 30}, ${192 - index * 30}, ${192 + index * 60}, 1)`,
        backgroundColor: `rgba(${75 + index * 30}, ${192 - index * 30}, ${192 + index * 60}, 0.2)`,
      };
    });
  
    // Now, assemble the chartData with allLabels and datasets
    const chartData = {
      labels: allLabels,
      datasets: datasets
    };
  
    return chartData;
  };
  
  // Use this function when rendering your chart component
  const chartData = generateChartData();


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
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Last Hours:
          <input type="number" value={hoursAgo} onChange={(e) => setHoursAgo(Number(e.target.value))} />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Data Points Limit:
          <input type="number" value={dataPointsLimit} onChange={(e) => setDataPointsLimit(Number(e.target.value))} />
        </label>
        <div>
          {dataTypes.map((dataType) => (
            <button key={dataType} onClick={() => toggleDataType(dataType)} style={{ marginLeft: '10px', background: selectedDataTypes.includes(dataType) ? 'lightgreen' : 'lightgrey' }}>
              {dataType}
            </button>
          ))}
        </div>

        <button onClick={toggleFetchEnabled} style={{ marginLeft: '10px', background: fetchEnabled ? 'lightgreen' : 'lightgrey' }}>
          {fetchEnabled ? 'Disable Fetching' : 'Enable Fetching'}
        </button>
      </div>
      <div>
        <label>
          Slave ID:
          <input type="number" value={slaveId} onChange={(e) => toggleSlaveId(Number(e.target.value))} />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Master ID:
          <input type="number" value={masterId} onChange={(e) => toggleMasterId(Number(e.target.value))} />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Modbus Type:
          <select value={modbusType} onChange={(e) => toggleModbusType(Number(e.target.value))}>
            <option value={2}>Modbus TCP 2</option>
            <option value={1}>Modbus RTU 1 </option>
          </select>
        </label>
      </div>
      <ExportButton chartRef={chartRef} /> {/* Pass chartInstance instead of chartRef */}
      <ResizableBox width={400} height={400} minConstraints={[100, 100]} maxConstraints={[1000, 500]}>
      <Line ref={chartRef} data={chartData} options={options} />
      </ResizableBox>
    </div>
  );
};

export default LineChartPage;