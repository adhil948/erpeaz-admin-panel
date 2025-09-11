import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export default function InfoCard({ title, value, icon, color, bgColor }) {
  return (
    <Paper
      elevation={6}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: bgColor,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'transform 0.15s ease-in-out',
        '&:hover': { transform: 'scale(1.05)' },
      }}
    >
      <Box sx={{ color: color, fontSize: 48 }}>{icon}</Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
