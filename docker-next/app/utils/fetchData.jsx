// utils/fetchData.js
export async function fetchData(endpoint) {
    const response = await fetch(`https://localhost:8000${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }
    return response.json();
  }