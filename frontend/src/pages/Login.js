// src/pages/Login.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setLoginError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, { email, password });
      // Pass token or user data up for app context handling
      onLoginSuccess(response.data.token);
    } catch (error) {
      setLoginError(
        error.response?.data?.error || 'Login failed. Please try again.'
      );
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{ maxWidth: 400, p: 4, width: '100%', borderRadius: 2 }}
      >
        <Typography variant="h5" align="center" mb={3}>
          ERPEaz Admin Panel Login
        </Typography>
        <form noValidate onSubmit={handleSubmit}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            autoComplete="email"
            autoFocus
          />
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            autoComplete="current-password"
          />
          {loginError && (
            <Typography color="error" variant="body2" mt={1} mb={1}>
              {loginError}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
