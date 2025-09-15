// pages/FiscalRevenue.jsx
import React from 'react';
import { Box, Paper, Typography, Stack, Skeleton, TextField, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TableContainer } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function currentFyStartYear(d = new Date()) {
  const y = d.getFullYear(), m = d.getMonth();
  return m >= 3 ? y : y - 1;
}

export default function FiscalRevenue() {
  const [fyStart, setFyStart] = React.useState(currentFyStartYear());
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  const load = React.useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`http://localhost:4000/api/revenue/fy-overview?fyStart=${fyStart}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setData(json);
    } catch (e) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, [fyStart]);

  React.useEffect(() => { load(); }, [load]);

  const fyOptions = [fyStart - 1, fyStart, fyStart + 1];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="medium">Fiscal Year Revenue</Typography>
        <TextField size="small" select label="FY start" value={fyStart} onChange={(e) => setFyStart(Number(e.target.value))} sx={{ minWidth: 160 }}>
          {fyOptions.map((y) => (
            <MenuItem key={y} value={y}>{`${y}-${String((y + 1) % 100).padStart(2, '0')}`}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Paper sx={{ p: 3 }}><Skeleton height={28} /><Skeleton height={20} /><Skeleton height={20} /></Paper>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Grand total: {INR.format(data?.grandTotal || 0)}</Typography>
            <Typography variant="caption" color="text.secondary">
              Window: {new Date(data.range.start).toLocaleDateString()} – {new Date(data.range.endExclusive).toLocaleDateString()}
            </Typography>
          </Paper>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Site</TableCell>
                  <TableCell align="right">FY total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.sites || []).map((row) => (
                  <TableRow
                    key={row.siteId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/sites/${row.siteId}`)}
                  >
                    <TableCell>{row.siteId}</TableCell>
                    <TableCell align="right">{INR.format(row.total)}</TableCell>
                  </TableRow>
                ))}
                {(!data?.sites || data.sites.length === 0) && (
                  <TableRow><TableCell colSpan={2}>No revenue found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
