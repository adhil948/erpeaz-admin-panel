// src/api/expenses.js
import axios from 'axios';

// export const listExpenses = async (siteId) => {
//   const { data } = await axios.get(`http://localhost:4000${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses`);
//   return data;
// };

// export const createExpense = async (siteId, payload) => {
//   const { data } = await axios.post(`http://localhost:4000${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses`, payload);
//   return data;
// };

// export const updateExpense = async (expenseId, payload) => {
//   const { data } = await axios.put(`/api/expenses/${expenseId}`, payload);
//   return data;
// };

// export const deleteExpense = async (expenseId) => {
//   const { data } = await axios.delete(`/api/expenses/${expenseId}`);
//   return data;
// };

// export const getExpenseSummary = async (siteId) => {
//   const { data } = await axios.get(`http://localhost:4000${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses/summary`);
//   return data; // { spent: {total,count}, planned: {...}, due: {...} }
// };


export const listExpenses = async (siteId) =>
  (await axios.get(`${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses`)).data;

export const createExpense = async (siteId, payload) =>
  (await axios.post(`${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses`, payload)).data;

export const updateExpense = async (siteId, expenseId, payload) =>
  (await axios.put(`${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses/${expenseId}`, payload)).data;

export const deleteExpense = async (siteId, expenseId) =>
  (await axios.delete(`${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses/${expenseId}`)).data;

export const getExpenseSummary = async (siteId) =>
  (await axios.get(`${process.env.REACT_APP_API_URL}/sites/${siteId}/expenses/summary`)).data;