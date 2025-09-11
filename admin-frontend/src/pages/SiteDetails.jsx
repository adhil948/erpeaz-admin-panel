// src/pages/SiteDetails.jsx
import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, Chip, Divider, Stack, Button, Card, CardContent
} from '@mui/material';
import { fetchSiteById } from '../api/sites';
import ExpensesSection from '../components/ExpensesSection'; // NEW

const MS_14_DAYS = 14 * 24 * 60 * 60 * 1000;

function isInTrial(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return Date.now() <= created + MS_14_DAYS;
}

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SiteDetails() {
  const { state } = useLocation(); // row from DataGrid onRowClick
  const { id } = useParams();      // /sites/:id
  const navigate = useNavigate();

  const [site, setSite] = React.useState(state || null);
  const [loading, setLoading] = React.useState(!state);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (site) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSiteById(id);
        if (active) setSite(data);
      } catch (e) {
        setError('Failed to load site');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, site]);

  const createdAt = site?.created_at;
  const trial = isInTrial(createdAt);
  const trialEnds = createdAt ? new Date(new Date(createdAt).getTime() + MS_14_DAYS) : null;

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography>Loading…</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  if (!site) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography>No data found</Typography>
      </Box>
    );
  }

  const siteId = site?._id || id; // for ExpensesSection
  console.log('SiteDetails rendering for siteId=', siteId);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" fontWeight="medium">Site Details</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Back</Button>
      </Stack>

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Grid container spacing={3}>
          {/* Summary header */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h6" fontWeight="medium">{site.name || 'Unnamed'}</Typography>
                <Chip label={site.plan || 'No Plan'} size="small" sx={{ height: 'auto', px: 1 }} />
                <Chip label={trial ? 'Trial' : 'Active'} color={trial ? 'warning' : 'success'} size="small" sx={{ height: 'auto', px: 1 }} />
                {createdAt && (
                  <Chip label={`Registered: ${formatDate(createdAt)}`} size="small" variant="outlined" sx={{ height: 'auto', px: 1 }} />
                )}
                {trialEnds && (
                  <Chip label={`Trial ends: ${formatDate(trialEnds)}`} size="small" variant="outlined" color="warning" sx={{ height: 'auto', px: 1 }} />
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Left: Organization details */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Organization Details</Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Company</Typography>
                  <Typography variant="body1">{site.company_name || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Address</Typography>
                  <Typography variant="body1">{site.company_address || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Email</Typography>
                  <Typography variant="body1">{site.email || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Phone</Typography>
                  <Typography variant="body1">{site.phone_number || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Country</Typography>
                  <Typography variant="body1">{site.country || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Users</Typography>
                  <Typography variant="body1">{site.user ?? '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Username</Typography>
                  <Typography variant="body1">{site.user_name || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Site URL/ID</Typography>
                  <Typography variant="body1">{site.site_url || '—'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right: Business metrics */}
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Business Metrics</Typography>
                <Divider sx={{ mb: 3 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>Total Revenue</Typography>
                    <Typography variant="h6" fontWeight="medium">₹0</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>ARPU</Typography>
                    <Typography variant="h6" fontWeight="medium">₹0</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>Status</Typography>
                    <Chip label={trial ? 'Trial' : 'Active'} color={trial ? 'warning' : 'success'} size="small" />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Full-width: Expenses (reusable) */}
          <Grid item xs={12}>
            <ExpensesSection siteId={siteId} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
