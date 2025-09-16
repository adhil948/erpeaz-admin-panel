import axios from "axios";

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}`, // or import.meta.env.VITE_API_URL if using Vite
});

// Fetch all sites
export async function fetchSites() {
  const res = await api.get("/sites");
  return res.data.data || [];
}

// Fetch single site by ID
export async function fetchSiteById(id) {
  const res = await api.get(`/sites/${id}`);
  return res.data;
}
