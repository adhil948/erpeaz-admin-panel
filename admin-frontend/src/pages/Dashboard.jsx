import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Grid, Paper, Box, useTheme, Skeleton, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StorageIcon from '@mui/icons-material/Storage';
import BarChartIcon from '@mui/icons-material/BarChart';
import { DataGrid } from '@mui/x-data-grid';
import { fetchSites } from '../api/dashboard';

export default function Dashboard() {
  const theme = useTheme();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await fetchSites();
        if (active) setSites(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setErr(error);
        // eslint-disable-next-line no-console
        console.error('Failed to fetch sites:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Metrics
  const totalSites = useMemo(() => sites.length, [sites]);
  const totalUsers = useMemo(() => sites.reduce((sum, s) => sum + (s.user || 0), 0), [sites]);

  const plansCount = useMemo(() => {
    return sites.reduce((acc, s) => {
      const plan = (s.plan || 'unknown').toString().toLowerCase();
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});
  }, [sites]);

  const activePlans = useMemo(() => sites.reduce((sum, s) => sum + (s.plan ? 1 : 0), 0), [sites]);

  // Normalize all keys to lowercase for safety
  const planPricing = {
    basic: { monthlyPrice: 0, billingMonths: 6 },
    professional: { monthlyPrice: 1099, billingMonths: 12 },
    enterprise: { monthlyPrice: 0, billingMonths: 12 },
    premium: { monthlyPrice: 1599, billingMonths: 12 },
    ultimate: { monthlyPrice: 2599, billingMonths: 12 },
  };

  // MRR and ARR
  const mrr = useMemo(() => {
    return sites.reduce((sum, s) => {
      const key = (s.plan || '').toString().toLowerCase();
      const p = planPricing[key];
      return sum + (p ? p.monthlyPrice : 0);
    }, 0);
  }, [sites]);

  const arr = useMemo(() => mrr * 12, [mrr]);

  const formatINR = useMemo(() => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }), []);

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
        bgcolor: 'background.paper',
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
        {loading ? <Skeleton variant="text" width={100} /> : value}
      </Typography>
      {loading ? <Skeleton variant="text" width={160} /> : extra}
    </Paper>
  );

  const cards = [
    {
      icon: <StorageIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Total Sites',
      value: totalSites,
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Total Users',
      value: totalUsers,
    },
    {
      icon: <MonetizationOnIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Active Plans',
      value: activePlans,
      extra: (
        <Typography variant="subtitle2" color="text.secondary" mt={1}>
          Basic: {plansCount.basic || 0} • Pro: {plansCount.professional || 0} • Premium: {plansCount.premium || 0} • Ult: {plansCount.ultimate || 0}
        </Typography>
      ),
    },
    {
      icon: <BarChartIcon sx={{ fontSize: 48, color: "black" }} />,
      label: 'Revenue',
      value: `${formatINR.format(mrr)} Monthly • ${formatINR.format(arr)} Annually`,
      extra: (
        <Typography variant="caption" color="text.secondary" mt={0.5}>
          Basic: 6mo • Pro/Ent: 1yr billing
        </Typography>
      ),
    },
  ];

  // Data Grid (Sites table)
  const columns = [
    { field: 'name', headerName: 'Site', flex: 1, minWidth: 140 },
    { field: 'plan', headerName: 'Plan', width: 130 },
    { field: 'user', headerName: 'Users', width: 100, type: 'number' },
    { field: 'createdAt', headerName: 'Created', flex: 1, minWidth: 160,
      valueGetter: (v) => v && (new Date(v)).toLocaleDateString() },
  ];

  const rows = sites.map((s, i) => ({
    id: s.id ?? i,
    name: s.name ?? `Site ${i + 1}`,
    plan: s.plan ?? '—',
    user: s.user ?? 0,
    createdAt: s.createdAt ?? null,
  }));

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary }}>
        Welcome to the Admin Dashboard
      </Typography>

      <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary, maxWidth: 600 }}>
        Overview of recent activity and key metrics.
      </Typography>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load data. Please retry or check your network.
        </Alert>
      )}

      <Grid container spacing={3} alignItems="stretch" sx={{ width: '100%', mb: 3 }}>
        {cards.map((card, idx) => (
          <Grid key={idx} item xs={12} sm={6} md={3} lg={3}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Sites
        </Typography>
        <div style={{ width: '100%', height: 440 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            }}
          />
        </div>
      </Paper>
    </Box>
  );
}
