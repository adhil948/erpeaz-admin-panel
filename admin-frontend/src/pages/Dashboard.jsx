import React, { useEffect, useState } from 'react';
import { Typography, Grid, Paper, Box, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StorageIcon from '@mui/icons-material/Storage';
import BarChartIcon from '@mui/icons-material/BarChart';
import { fetchSites } from '../api/dashboard';

export default function Dashboard() {
  const theme = useTheme();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSites();
        if (active) setSites(data || []);
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const totalSites = sites.length;
  const totalUsers = sites.reduce((sum, site) => sum + (site.user || 0), 0);

  const plansCount = sites.reduce((acc, site) => {
    const plan = site.plan?.toLowerCase() || 'unknown';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const activePlans = sites.reduce((sum, site) => sum + (site.plan ? 1 : 0), 0);

  // Updated pricing with different billing cycles
  const planPricing = {
    basic: { monthlyPrice: 0, billingMonths: 6 },      // 6-month billing
    professional: { monthlyPrice: 1099, billingMonths: 12 }, // 1-year billing
    enterprise: { monthlyPrice: 0, billingMonths: 12 },    // 1-year billing
    Premium: { monthlyPrice: 1599, billingMonths: 12 } ,
    ultimate: { monthlyPrice: 2599, billingMonths: 12 }    // 1-year billing
  };

  // Calculate total revenue based on billing cycles
  const totalRevenue = sites.reduce((sum, site) => {
    const planKey = site.plan?.toLowerCase();
    const pricing = planPricing[planKey];
    if (pricing) {
      return sum + (pricing.monthlyPrice );
    }
    return sum;
  }, 0);

  const formatINR = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  const cardHeight = 160;

  const StatCard = ({ icon, label, value, extra }) => (
    <Paper
      elevation={6}
      sx={{
        width: '100%',
        height: cardHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2.5,
        borderRadius: 3,
        boxShadow: '0px 6px 24px rgba(40,40,40,0.10)',
        transition: 'transform 0.15s cubic-bezier(.17,.67,.83,.67)',
        bgcolor: '#fff',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.03)',
          boxShadow: '0px 12px 36px rgba(40,40,40,0.14)',
        },
      }}
    >
      {icon}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
      {extra}
    </Paper>
  );

  const cards = [
    {
      icon: <StorageIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Total Sites',
      value: loading ? 'Loading…' : totalSites,
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Total Users',
      value: loading ? 'Loading…' : totalUsers,
    },
    {
      icon: <MonetizationOnIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Active Plans',
      value: loading ? '—' : activePlans,
      extra: !loading && (
        <Typography variant="subtitle2" color="text.secondary" mt={1}>
          Basic: {plansCount.basic || 0} • Pro: {plansCount.professional || 0} • Premium: {plansCount.premium || 0} • Ult: {plansCount.ultimate || 0}
        </Typography>
      ),
    },
    {
      icon: <BarChartIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Total Revenue',
      value: loading ? 'Loading…' : formatINR.format(totalRevenue),
      extra: !loading && (
        <Typography variant="caption" color="text.secondary" mt={0.5}>
          Basic: 6mo • Pro/Ent: 1yr billing
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary }}>
        Welcome to the Admin Dashboard
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary, maxWidth: 600 }}>
        Overview of recent activity and key metrics.
      </Typography>

      <Grid
        container
        spacing={3}
        alignItems="stretch"
        sx={{
          width: '100%',
        }}
      >
        {cards.map((card, idx) => (
          <Grid key={idx} item xs={12} sm={6} md={3} lg={3}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
