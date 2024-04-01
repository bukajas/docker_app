// pages/index.js
"use client";
import React, { useState } from 'react';

const DeleteDataForm = () => {
  // State to hold the measurement name
  const [measurement, setMeasurement] = useState('');
  // State to hold the hours input
  const [hours, setHours] = useState('');

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Validate hours input to ensure it's a number
    if (isNaN(hours) || hours < 0) {
      alert('Please enter a valid number of hours');
      return;
    }
 
    // Construct the API endpoint URL
    const apiUrl = 'http://127.0.0.1:8000/delete_data'; // Replace this with the full URL if needed
    const token = localStorage.getItem('token');

    try {
      console.log(measurement,hours)
      // Send a DELETE request to the API endpoint with additional hours parameter
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ measurement, hours }), // Send both measurement and hours
      });

      if (!response.ok) {
        throw new Error('Failed to delete the measurement data');
      }

      const result = await response.json();
      alert(result.message); // Show success message
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting measurement data'); // Show error message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="measurement">Measurement Name:</label>
        <input
          type="text"
          id="measurement"
          value={measurement}
          onChange={(e) => setMeasurement(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="hours">Delete Data Older Than (Minutes):</label>
        <input
          type="number"
          id="hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          required
          min="0" // Ensure non-negative numbers
        />
      </div>
      <button type="submit">Delete Data</button>
    </form>
  );
};

export default DeleteDataForm;