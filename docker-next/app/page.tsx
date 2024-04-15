"use client";
"use client";
import { AppBar, Toolbar, Button, Drawer, List, ListItem, ListItemText, Container, Typography } from '@mui/material';
import React, { useState } from 'react';
import LineChartPage from "./chart/chart_copy"; // Import your chart component

import DeleteDataForm from "./delete/delete"; // Component for deleting data
import DataEditor from "./edit/edit"; // Component for editing data
import Login from "./login"; // Login component
import DataExportForm from "./export/export_csv"; // Component for exporting data
import ChartContainer from "./chart/chart_container"
import Register from "./Registration"
import UsersPage from "./change_roles"
import DataExportForm2 from "./export/export_CSV_dev";


export default function Home() {
  const [activeComponent, setActiveComponent] = useState('default');
  const [chartInstances, setChartInstances] = useState([]);
  const [nextId, setNextId] = useState(0);
  
  const addChartInstance = () => {
    const newChart = { id: nextId, component: <LineChartPage key={nextId} /> };
    setChartInstances([...chartInstances, newChart]);
    setNextId(nextId + 1);
  };


  const deleteChartInstance = (idToRemove) => {
    setChartInstances(chartInstances.filter(chart => chart.id !== idToRemove));
  };

  const showChartView = () => {
    setActiveComponent('charts');
  };

  // Function to display the chart instances
  const renderCharts = () => (
    <>
      <Button variant="contained" color="primary" onClick={addChartInstance}>
        Add New Chart
      </Button>
      {chartInstances.length === 0 ? (
        <Typography>No charts to display. Use the "Add New Chart" button to get started.</Typography>
      ) : (
        chartInstances.map(chart => (
          <div key={chart.id}>
            {chart.component}
            <Button variant="contained" color="error" onClick={() => deleteChartInstance(chart.id)}>
              Delete This Chart
            </Button>
          </div>
        ))
      )}
    </>
  );
  // Drawer items
  const drawerItems = (
    <List>
      <ListItem button onClick={() => setActiveComponent('default')}>
        <ListItemText primary="Login / Show Default" />
      </ListItem>
      <ListItem button onClick={() => setActiveComponent('edit')}>
        <ListItemText primary="Edit Data" />
      </ListItem>
      <ListItem button onClick={() => setActiveComponent('delete')}>
        <ListItemText primary="Delete Data" />
      </ListItem>
      {/* <ListItem button onClick={showChartView}>
        <ListItemText primary="Show Charts" />
      </ListItem> */}
      <ListItem button onClick={() => setActiveComponent('export')}>
        <ListItemText primary="Export Data" />
      </ListItem>
      <ListItem button onClick={() => setActiveComponent('Graphs')}>
        <ListItemText primary="Graphs" />
      </ListItem>
      {/* Add other list items for additional actions */}
    </List>
  );


  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Graph Dashboard
          </Typography>
        <Login />
        <Register />
        <UsersPage />
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="left"
      >
        {drawerItems}
      </Drawer>
      <Container>
        {/* Conditionally render components based on activeComponent state */}
        {activeComponent === 'default' && <Typography>Welcome to the Graph Dashboard</Typography>}
        {/* {activeComponent === 'charts' && renderCharts()} */}
        {activeComponent === 'edit' && <DataEditor />}
        {activeComponent === 'delete' && <DeleteDataForm />}
        {activeComponent === 'export' && <DataExportForm2 />}
        {activeComponent === 'Graphs' && <ChartContainer />}

      </Container>
    </div>
  );
}
