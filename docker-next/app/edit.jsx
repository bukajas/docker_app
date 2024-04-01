"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataEditor1 from "./editBatch";

const DataEditor = () => {
  const [data, setData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [rangeInMinutes, setRangeInMinutes] = useState(60); // Default range
  const [measurementName, setMeasurementName] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [slaveID, setSlaveID] = useState('');
  const [masterID, setMasterID] = useState('');
  const [modbusType, setModbusType] = useState('');

  useEffect(() => {
    fetchData();
  }, [rangeInMinutes, measurementName, fieldName, slaveID, masterID, modbusType]);

  

  const fetchData = async () => {
    if (!rangeInMinutes || !measurementName || !fieldName || !slaveID || !masterID || !modbusType) {
      console.log("All input fields must be filled in");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/modify_data_read', {
        params: {
          range_in_minutes: rangeInMinutes,
          measurement_name: measurementName,
          field_name: fieldName,
          slave_id: slaveID,
          master_id: masterID,
          modbus_type: modbusType
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      setData(response.data);
      console.log(response.data)
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditValue(data[index].value);
  };

  const handleDelete = async (index) => {  // Now accepts an index
    const itemToDelete = data[index];
    if (!itemToDelete) {
      console.error("Invalid item selected for deletion");
      return;
    }

    try {
      console.log(itemToDelete.time, new Date(new Date(itemToDelete.time).getTime() + 60000).toISOString(), measurementName, fieldName, slaveID, masterID, modbusType);
      const token = localStorage.getItem('token');
      const response = await axios.delete('http://127.0.0.1:8000/modify_data_delete', {
        data: {
          start_time: new Date(itemToDelete.time).toISOString(), // Ensure this matches ISO format
          end_time: new Date(new Date(itemToDelete.time).getTime() + 1).toISOString(),
          measurement_name: measurementName,
          field_name: fieldName,
          slave_id: parseInt(slaveID), // Make sure IDs are integers
          master_id: parseInt(masterID),
          modbus_type: parseInt(modbusType),
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(response.data.message);
      fetchData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting data:', error);
    }
};
  

  const handleUpdate = async () => {
    if (editIndex === null) {
      console.error("No item selected for update");
      return;
    }
  
    // Assuming the data item has a 'time' field to identify it.
    // This part might need adjustment based on your data structure.
    const itemToUpdate = data[editIndex];
    if (!itemToUpdate) {
      console.error("Invalid item selected");
      return;
    }
  
    try {
      // Adjust this URL and parameters according to your API's requirements
      const token = localStorage.getItem('token');
      console.log(itemToUpdate.time)
      console.log(new Date(new Date(itemToUpdate.time).getTime() + 10).toISOString())
      const response = await axios.post('http://127.0.0.1:8000/modify_data_update', {

        start_time: itemToUpdate.time, // Use the item's timestamp as start time for simplicity
        end_time: new Date(new Date(itemToUpdate.time).getTime() + 10).toISOString(), // Assuming updates within a 1 minute range; adjust as needed
        measurement_name: measurementName,
        field_name: fieldName,
        slave_id: slaveID,
        master_id: masterID,
        modbus_type: modbusType,
        value: editValue, // New value to update
        headers: {
          Authorization: `Bearer ${token}`,
        }
      },

      
      );

  
      console.log('Update response:', response.data);
      setEditIndex(null); // Reset edit index
      fetchData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };

  return (
    <div>
      <DataEditor1 />
      <h2>Data Editor</h2>
      <div>
        <label>Range in Minutes: </label>
        <input type="number" value={rangeInMinutes} onChange={(e) => setRangeInMinutes(e.target.value)} />
      </div>
      <div>
        <label>Measurement Name: </label>
        <input type="text" value={measurementName} onChange={(e) => setMeasurementName(e.target.value)} />
      </div>
      <div>
        <label>Field Name: </label>
        <input type="text" value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
      </div>
      <div>
        <label>Slave ID: </label>
        <input type="number" value={slaveID} onChange={(e) => setSlaveID(e.target.value)} />
      </div>
      <div>
        <label>Master ID: </label>
        <input type="number" value={masterID} onChange={(e) => setMasterID(e.target.value)} />
      </div>
      <div>
        <label>Modbus Type: </label>
        <input type="number" value={modbusType} onChange={(e) => setModbusType(e.target.value)} />
      </div>
      <ul>
        {data.map((item, index) => (
          <li key={item.id}>
            {editIndex === index ? (
              <>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <button onClick={() => handleUpdate(item.id)}> Save</button>
                <button onClick={() => setEditIndex(null)}> Cancel</button>
              </>
            ) : (
              <>
                {item.time + ">>>>>" + item.field + ":> " + item.value + " "}
                <button onClick={() => handleEdit(index)}> Edit</button>
                <button onClick={() => handleDelete(index)}> Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DataEditor;
