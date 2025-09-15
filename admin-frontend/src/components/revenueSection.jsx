// components/RevenueSection.jsx
import React from 'react';
import { Box, Paper, Typography, Divider, Stack, List, ListItem, ListItemText, Skeleton, Button } from '@mui/material';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function RevenueSection({ siteId }) {
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState(null);
  const [txns, setTxns] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [limit, setLimit] = React.useState(20);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, t] = await Promise.all([
        fetch(`http://localhost:4000/api/sites/${siteId}/revenue/summary`).then(r => r.json()),
        fetch(`http://localhost:4000/api/sites/${siteId}/revenue/transactions?limit=${limit}`).then(r => r.json()),
      ]);
      setSummary(s);
      setTxns(t?.items || []);
    } catch (e) {
      setError('Failed to load revenue');
    } finally {
      setLoading(false);
    }
  }, [siteId, limit]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium">Revenue</Typography>
        {!loading && <Button size="small" onClick={load}>Refresh</Button>}
      </Stack>
      {loading ? (
        <Stack spacing={1}>
          <Skeleton height={28} />
          <Skeleton height={20} />
          <Skeleton height={20} />
        </Stack>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total received</Typography>
              <Typography variant="h6" fontWeight="medium">{INR.format(summary?.total || 0)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Last 30 days</Typography>
              <Typography variant="h6" fontWeight="medium">{INR.format(summary?.last30Days || 0)}</Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent payments</Typography>
          <List dense disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {txns.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No payments found</Typography>
            ) : txns.map((x) => (
              <ListItem key={x._id} sx={{ px: 0 }}>
                <ListItemText
                  primary={INR.format(x.amount)}
                  secondary={`${new Date(x.date).toLocaleDateString()}${x.note ? ' • ' + x.note : ''}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
}
