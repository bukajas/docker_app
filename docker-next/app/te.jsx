"use client";
import { useEffect, useState } from 'react';

const ApiFetchPage = () => {
  const [apiData, setApiData] = useState([]);
  const [values, setValues] = useState([]);
  const [times, setTimes] = useState([]);

// TODO read data can be specified, time, data, range, amount
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



  return (
    <div>

      <div>
        {/* <h2>Response from the API:</h2> */}
        {/* {values.map((value, index) => (
          <div key={index}>
              Value: {value}, Time: {times[index]}
          </div>
          ))} */}
        {/* {console.log(times)} */}
        {/* {apiData ? <pre>{JSON.stringify(apiData, null, 2)}</pre> : 'Loading...'} */}
      </div>
    </div>
  );
};

export default ApiFetchPage;