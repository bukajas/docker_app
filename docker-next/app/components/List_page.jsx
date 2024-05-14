// components/DrawerItems.js
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';  // Make sure the path matches where the AuthContext is defined
import { List, ListItem, ListItemText,Button } from '@mui/material';

const DrawerItems = ({ setActiveComponent }) => {
    const { scopes,isAuthenticated } = useContext(AuthContext); // Use useContext to access the current authentication context

    const hasAdminScope = scopes.includes('admin');
    const hasReadScope = scopes.includes('read');
    const hasReadWriteScope = scopes.includes('read+write');


  return (
    <List>
      <ListItem button onClick={() => setActiveComponent('default')}>
        <ListItemText primary="Login / Show Default" />
      </ListItem>
      {isAuthenticated && (hasReadWriteScope || hasAdminScope) && (
        <ListItem button onClick={() => setActiveComponent('edit')}>
          <ListItemText primary="Edit Data" />
        </ListItem>
      )}
      {isAuthenticated && (hasReadWriteScope || hasAdminScope) && (
        <ListItem button onClick={() => setActiveComponent('delete')}>
          <ListItemText primary="Delete Data" />
        </ListItem>
      )}
      {isAuthenticated && (hasReadScope || hasReadWriteScope || hasAdminScope) && (
        <ListItem button onClick={() => setActiveComponent('export')}>
          <ListItemText primary="Export Data" />
        </ListItem>
      )}
      {isAuthenticated && (hasReadScope || hasReadWriteScope || hasAdminScope) && (
        <ListItem button onClick={() => setActiveComponent('Graphs')}>
          <ListItemText primary="Graphs" />
        </ListItem>
      )}
      {/* Add other list items for additional actions */}
    </List>
  );
};

export default DrawerItems;
