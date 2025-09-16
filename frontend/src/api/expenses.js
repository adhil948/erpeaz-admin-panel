// src/api/expenses.js
import axios from 'axios';




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