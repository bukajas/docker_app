"use client";
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Home from './Home'; // Adjust the path according to your project structure

const App = () => {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
};

export default App;
