"use client";
"use client";
import { AppBar, Toolbar, Button, Drawer, List, ListItem, ListItemText, Container, Typography } from '@mui/material';
import React, { useState } from 'react';


import DeleteDataForm from "./delete/delete"; // Component for deleting data
import DataEditor from "./edit/edit"; // Component for editing data
import Login from "./login"; // Login component
import ChartContainer from "./chart/chart_container"
import Register from "./Registration"
import UsersPage from "./change_roles"
import DataExportForm2 from "./export/export_CSV";
import { AuthProvider } from './context/AuthContext';
import RetentionPolicyPopup from './retencion/Retencion'
import DrawerItems from './components/List_page'; // Adjust the path according to your project structure

export default function Home() {
  const [activeComponent, setActiveComponent] = useState('default');
  const [chartInstances, setChartInstances] = useState([]);
  const [nextId, setNextId] = useState(0);
  



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