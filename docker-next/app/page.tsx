"use client";
"use client";
import { AppBar, Toolbar, Button, Drawer, List, ListItem, ListItemText, Container, Typography } from '@mui/material';
import React, { useState } from 'react';
import LineChartPage from "./chart/chart_copy"; // Import your chart component

import DeleteDataForm from "./delete/delete"; // Component for deleting data
import DataEditor from "./edit/edit"; // Component for editing data
import Login from "./login"; // Login component
import ChartContainer from "./chart/chart_container"
import Register from "./Registration"
import UsersPage from "./change_roles"
import DataExportForm2 from "./export/export_CSV";
import { AuthProvider } from './context/AuthContext';
import DropdownMenu from "./te"
import RetentionPolicyPopup from './retencion/Retencion'
import DrawerItems from './components/List_page'; // Adjust the path according to your project structure

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <AuthProvider>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Graph Dashboard
          </Typography>
          <Login />
          <Register />
          <UsersPage />
          <RetentionPolicyPopup />
        </Toolbar>
      </AppBar>
      <div style={{ display: 'flex', flexDirection: 'column-reverse', flexGrow: 1 }}>
        <Container maxWidth="xl" style={{ flexGrow: 1 }}>
          {/* Conditionally render components based on activeComponent state */}
          {activeComponent === 'default' && <DropdownMenu/>}
          {activeComponent === 'edit' && <DataEditor />}
          {activeComponent === 'delete' && <DeleteDataForm />}
          {activeComponent === 'export' && <DataExportForm2 />}
          {activeComponent === 'Graphs' && <ChartContainer />}
          {/* Add other conditional components as needed */}
        </Container>
        <Drawer variant="permanent" anchor="left">
          <DrawerItems setActiveComponent={setActiveComponent} />
        </Drawer>
      </div>
    </AuthProvider>
  </div>
  );
}
