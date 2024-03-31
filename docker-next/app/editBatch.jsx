import React, { useState } from 'react';
import axios from 'axios';

const DataEditor = () => {
  // State for form inputs, modal visibility, and the new update value
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slaveID, setSlaveID] = useState('');
  const [masterID, setMasterID] = useState('');
  const [modbusType, setModbusType] = useState('');
  const [updateValue, setUpdateValue] = useState(''); // New state for holding the updated value

  // Function to combine date and time into a single ISO string
  const combineDateTime = (date, time) => `${date}T${time}`;

  // Function to fetch data based on the specified parameters
  const fetchData = async () => {
    const startDateTime = combineDateTime(startDate, startTime);
    const endDateTime = combineDateTime(endDate, endTime);

    try {
      const response = await axios.get('http://127.0.0.1:8000/modify_data_read', {
        params: {
          start_time: startDateTime,
          end_time: endDateTime,
          slave_id: slaveID,
          master_id: masterID,
          modbus_type: modbusType,
        }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Function to update the value for all data entries that match the specification
  const updateAllDataValues = async () => {
    // Ensure there is data to update
    if (data.length === 0) {
      alert('No data to update');
      return;
    }
  
    // Sort the data by time to ensure the correct order
    const sortedData = [...data].sort((a, b) => new Date(a.time) - new Date(b.time));
    
    // Find the start time of the first entry and the end time of the last entry
    const startTime = sortedData[0].time;
    const endTime = sortedData[sortedData.length - 1].time;
  
    // Prepare the payload for the update request
    const payload = {
      start_time: startTime,
      end_time: endTime,
      measurement_name: "coil_list",
      field_name: "coils",
      slave_id: parseInt(slaveID),
      master_id: parseInt(masterID),
      modbus_type: parseInt(modbusType),
      value: parseFloat(updateValue),
    };
  
    try {
      // Make a single API request to update all entries in the range
      const response = await axios.post('http://127.0.0.1:8000/modify_data_update', payload);
      console.log('Update successful:', response.data);
      // Notify the user of success
      alert('Data updated successfully');
    } catch (error) {
      console.error('Error updating data:', error);
      // Notify the user of failure
      alert('Failed to update data');
    }
  };

  return (
    <div>
      <h2>Data Editor</h2>
      <button onClick={() => setShowModal(true)}>Open Modal</button>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h2>Specify Data Parameters</h2>
            {/* Existing input fields */}
            <label>Start Date:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label>Start Time:</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <label>End Date:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <label>End Time:</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            <label>Slave ID:</label>
            <input type="number" value={slaveID} onChange={(e) => setSlaveID(e.target.value)} />
            <label>Master ID:</label>
            <input type="number" value={masterID} onChange={(e) => setMasterID(e.target.value)} />
            <label>Modbus Type:</label>
            <input type="number" value={modbusType} onChange={(e) => setModbusType(e.target.value)} />
            <label>New Value for Update:</label>
            <input type="text" value={updateValue} onChange={(e) => setUpdateValue(e.target.value)} />
            <button onClick={fetchData}>Fetch Data</button>
            <button onClick={updateAllDataValues}>Save Changes</button> {/* Button to apply the update to all data entries */}
          </div>
          <ul>
            {data.map((item, index) => (
              <li key={index}>
                {item.time} - {item.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataEditor;
