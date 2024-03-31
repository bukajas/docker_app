"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';


Chart.register(...registerables);


const LineChartPage = () => {  
    const [apiData, setApiData] = useState([]);
    const [values, setValues] = useState([]);
    const [times, setTimes] = useState([]);
    const [time, setTime] = useState(Date.now());
    
    useEffect(() => {
        async function fetchData() {
        try {
            const response = await fetch('http://127.0.0.1:8000/read_data');
            if (response.ok) {
            const data = await response.json();
            setApiData(data);
            } else {
            console.error('Error fetching data:', response.status);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        };
        fetchData();
    }, []);
    useEffect(() => {
        if (apiData && apiData.data) {
            setValues(apiData.data.map(dataPoint => dataPoint.value));
            setTimes(apiData.data.map(dataPoint => dataPoint.time));
        }
        }, [apiData]);

        // useEffect(() => {
        //     const timer = setInterval(() => {
        //       window.location.reload();
        //     }, 1000);
         
        //     // Clean up the timer when the component is unmounted
        //     return () => {
        //       clearInterval(timer);
        //     };
        //   }, []);


          useEffect(() => {
            if (apiData && apiData.data) {
                const updatedValues = apiData.data.map(dataPoint => dataPoint.value);
                const updatedTimes = apiData.data.map(dataPoint => dataPoint.time);
                if (updatedValues.length > 20) {
                    updatedValues.shift();
                    updatedTimes.shift();
                }
                setValues(updatedValues);
                setTimes(updatedTimes);
            }
        }, [apiData]);


    
 const chartRef = useRef(null);


 const data = {
    labels: times,
    datasets: [
      {
        label: 'Temperature',
        data: values,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
 };
 const options = {
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
 };

 return (
    <div>
      <h1>Line Chart Page</h1>
      <button onClick={fetchData}>Fetch DATA</button>
      <Line ref={chartRef} data={data} options={options} />
    </div>
 );
};

export default LineChartPage;