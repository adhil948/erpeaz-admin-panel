import React, { useEffect, useState } from 'react';
import InfoCard from './InfoCard';
import StorageIcon from '@mui/icons-material/Storage';
import { useTheme, alpha } from '@mui/material/styles';
import axios from 'axios';

export default function TotalSitesCard() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    async function fetchSitesCount() {
      try {
        setLoading(true);
        const response = await axios.get('/api/sites');
        const sites = response.data;
        setCount(sites.length);
      } catch (err) {
        console.error('Failed to load sites count', err);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchSitesCount();
  }, []);

  return (
    <InfoCard
      title="Total Sites"
      value={loading ? 'Loading...' : count}
      icon={<StorageIcon fontSize="inherit" />}
      color={theme.palette.primary.main}
      bgColor={alpha(theme.palette.primary.main, 0.1)}
    />
  );
}
