import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const scanUrl = async (url) => {
  const response = await apiClient.post('/scan', { url });
  return response.data;
};

export const fetchHistory = async () => {
  const response = await apiClient.get('/history');
  return response.data;
};

export const fetchScanById = async (id) => {
  const response = await apiClient.get(`/scan/${id}`);
  return response.data;
};

export const clearHistory = async () => {
  const response = await apiClient.delete('/history');
  return response.data;
};

export default apiClient;
