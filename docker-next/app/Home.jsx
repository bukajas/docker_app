"use client";
import { AppBar, Toolbar, Drawer, Container, Typography } from '@mui/material';
import React, { useState, useContext } from 'react';
import DeleteDataForm from "./delete/delete"; // Component for deleting data
import DataEditor from "./edit/edit"; // Component for editing data
import Login from "./login"; // Login component
import ChartContainer from "./chart/chart_container"
import Register from "./Registration"
import UsersPage from "./change_roles"
import DataExportForm2 from "./export/export_CSV";

import RetentionPolicyPopup from './retencion/Retencion'
import DrawerItems from './components/List_page'; // Adjust the path according to your project structure
import { AuthContext } from './context/AuthContext';  // Make sure the path matches where the AuthContext is defined


export default function Home() {
  const [activeComponent, setActiveComponent] = useState('default');
  const { scopes,isAuthenticated } = useContext(AuthContext); // Use useContext to access the current authentication context
  
  
  
  const hasAdminScope = scopes.includes('admin');
  const hasReadScope = scopes.includes('read');
  const hasReadWriteScope = scopes.includes('read+write');
  
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
          <RetentionPolicyPopup />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" anchor="left">
        <DrawerItems setActiveComponent={setActiveComponent} />
      </Drawer>
      <Container>

{/* Conditionally render components based on activeComponent state */}
        {activeComponent === 'edit' && isAuthenticated && (hasReadWriteScope || hasAdminScope) && <DataEditor />}
        {activeComponent === 'delete' && isAuthenticated && (hasReadWriteScope || hasAdminScope) && <DeleteDataForm />}
        {activeComponent === 'export' && isAuthenticated && (hasReadScope || hasReadWriteScope || hasAdminScope) && <DataExportForm2 />}
        {activeComponent === 'Graphs' && isAuthenticated && (hasReadScope || hasReadWriteScope || hasAdminScope) && <ChartContainer />}
          {/* Add other conditional components as needed */}
      </Container>
    </div>
  );
}