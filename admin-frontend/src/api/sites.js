// src/api/sites.js
import axios from 'axios';

export async function fetchSites() {
  const response = await axios.get('http://localhost:4000/api/sites');
  return response.data.data || [];  // <-- make sure it's always an array
}


