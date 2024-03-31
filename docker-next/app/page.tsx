"use client";
import React, { useState } from 'react';
import ApiFetchPage from "./te";
import LineChartPage from "./chart_copy";
import DeleteDataForm from "./delete";
import DataEditor from "./edit"; // Import the Edit page component
import Login from "./login";
import DataExportForm from "./export_csv"

export default function Home() {
  const [showDefault, setShowDefault] = useState(true);
  const [chartInstances, setChartInstances] = useState([]); // State to store instances of LineChartPage
  const [nextId, setNextId] = useState(0); // State to store the next unique id for a new chart instance

  // Function to add a new instance of LineChartPage
  const addChartInstance = () => {
    const newChart = { id: nextId, component: <LineChartPage key={nextId} /> };
    setChartInstances([...chartInstances, newChart]);
    setNextId(nextId + 1); // Increment the id for the next chart
  };

  // Function to remove a specified instance of LineChartPage
  const deleteChartInstance = (idToRemove) => {
    setChartInstances(chartInstances.filter(chart => chart.id !== idToRemove));
  };

  return (
    <main>
      <button onClick={() => setShowDefault(true)}>Show Default Pages</button>
      <button onClick={() => setShowDefault(false)}>Show Edit Page</button>
      {showDefault ? (
        <>
          {/* <ApiFetchPage /> */}
          <Login />
          <div>
            {chartInstances.map(chart => (
              <div key={chart.id}>
                {chart.component}
                <button onClick={() => deleteChartInstance(chart.id)}>Delete This Chart</button>
              </div>
            ))}
          </div>
          <button onClick={addChartInstance}>Add Chart</button>
          <DeleteDataForm />
          <DataExportForm />
        </>
      ) : (
        <DataEditor />
      )}
    </main>
  );
}

