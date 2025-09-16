import axios from 'axios';


export async function fetchSites() {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/sites`);
  return response.data.data || [];  // <-- make sure it's always an array
}