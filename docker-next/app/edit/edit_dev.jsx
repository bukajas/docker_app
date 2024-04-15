"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const DataList = ({ data, onDelete }) => {
  return (
    <List>
      {data.map((item, index) => (
        <ListItem 
          key={index}
          secondaryAction={
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => onDelete(item)}
            >
              Delete
            </Button>
          }
        >
          <ListItemText 
            primary={Object.entries(item).map(([key, value]) => `${key}: ${value}`).join(', ')}
          />
        </ListItem>
      ))}
    </List>
  );
};

const DataEditor2 = () => {
    const [measurements, setMeasurements] = useState({});
    const [selectedMeasurement, setSelectedMeasurement] = useState('');
    const [rangeInMinutes, setRangeInMinutes] = useState('');
    const [tagFilters, setTagFilters] = useState({});
    const [data, setData] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [editValue, setEditValue] = useState('');
  
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
  
    const fetchData = async () => {
      try {
        const body = {
          measurement: selectedMeasurement,
          rangeInMinutes,
          tag_filters: tagFilters,
        }
        console.log(body)
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/modify_data_read', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
  
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
  
  
  
    const handleEdit = (index) => {
      setEditIndex(index);
      setEditValue(data[index].value);
    };
  
  const handleDelete = async (item) => {
      // Construct your request payload using the selectedMeasurement, rangeInMinutes, and tagFilters
    //   const payload = {
    //     measurement: selectedMeasurement,
    //     rangeInMinutes: rangeInMinutes, // or deleteRangeInMinutes if using separate state
    //     tag_filters: tagFilters, // or deleteTagFilters if using separate state
    //   };
  
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/modify_data_delete', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        });
        console.log(payload)
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
  
    const renderTagInputs = () => {
      const measurementTags = measurements[selectedMeasurement] || [];
      return measurementTags.map((tag) => (
        <TextField
          key={tag}
          label={tag}
          variant="outlined"
          margin="normal"
          fullWidth
          onChange={(e) => setTags({ ...tags, [tag]: e.target.value })}
          required
        />
      ));
    };

  return (
    <DataList data={data} onDelete={handleDelete} />
  );
};
export default DataEditor2;