// components/RevenueFYOverview.jsx
import React from 'react';
import {
  Box, Paper, Typography, Stack, Skeleton, TextField, MenuItem,
  Accordion, AccordionSummary, AccordionDetails, Divider, IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function currentFyStartYear(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0=Jan
  return m >= 3 ? y : y - 1;
}

export default function RevenueFYOverview() {
  const [fyStart, setFyStart] = React.useState(currentFyStartYear());
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [expanded, setExpanded] = React.useState(null);
  const [siteDetails, setSiteDetails] = React.useState({}); // { [siteId]: { loading, error, summary } }

  const loadOverview = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:4000/api/revenue/fy-overview?fyStart=${fyStart}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, [fyStart]);

  React.useEffect(() => { loadOverview(); }, [loadOverview]);

  const loadSiteSummary = async (siteId) => {
    if (!siteId) return;
    setSiteDetails(prev => ({ ...prev, [siteId]: { ...(prev[siteId] || {}), loading: true, error: null } }));
    try {
      const res = await fetch(`http://localhost:4000/api/sites/${encodeURIComponent(siteId)}/revenue/fy-summary?fyStart=${fyStart}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setSiteDetails(prev => ({ ...prev, [siteId]: { loading: false, error: null, summary: json } }));
    } catch (e) {
      setSiteDetails(prev => ({ ...prev, [siteId]: { loading: false, error: e.message || 'Failed to load' } }));
    }
  };

  const handleExpand = (siteId) => async (_e, isExp) => {
    setExpanded(isExp ? siteId : null);
    if (isExp && !siteDetails[siteId]?.summary && !siteDetails[siteId]?.loading) {
      await loadSiteSummary(siteId);
    }
  };

  const fyOptions = [fyStart - 1, fyStart, fyStart + 1];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="medium">Fiscal Year Revenue (All Sites)</Typography>
          <TextField
            size="small"
            select
            label="FY start"
            value={fyStart}
            onChange={(e) => setFyStart(Number(e.target.value))}
            sx={{ minWidth: 160 }}
          >
            {fyOptions.map((y) => (
              <MenuItem key={y} value={y}>{`${y}-${String((y + 1) % 100).padStart(2, '0')}`}</MenuItem>
            ))}
          </TextField>
        </Stack>

        {loading ? (
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Skeleton height={28} />
            <Skeleton height={20} />
            <Skeleton height={20} />
          </Stack>
        ) : error ? (
          <Typography sx={{ mt: 2 }} color="error">{error}</Typography>
        ) : (
          <Stack sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Grand total: {INR.format(data?.grandTotal || 0)}</Typography>
            <Typography variant="caption" color="text.secondary">
              Window: {new Date(data.range.start).toLocaleDateString()} – {new Date(data.range.endExclusive).toLocaleDateString()}
            </Typography>
          </Stack>
        )}
      </Paper>

    
{/* Grand + monthly totals across all sites */}
<Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
  {/* ... FY selector and grand total as before ... */}
  {!loading && !error && (
    <>
      <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Monthly totals (FY)</Typography>
      </Stack>
      <Stack spacing={0.5} sx={{ mt: 1 }}>
        {(data?.monthly || []).map((m) => (
          <Stack key={`${m.year}-${m.month}`} direction="row" justifyContent="space-between">
            <Typography variant="body2">{`${m.year}-${String(m.month).padStart(2, '0')}`}</Typography>
            <Typography variant="body2">{INR.format(m.total)}</Typography>
          </Stack>
        ))}
        {(!data?.monthly || data.monthly.length === 0) && (
          <Typography variant="body2" color="text.secondary">No payments in this FY</Typography>
        )}
      </Stack>
    </>
  )}
</Paper>

{/* Sites list with names */}
{(data?.sites || []).map((row) => {
  const s = siteDetails[row.siteId]; // holds loading/error/summary per site
  return (
    <Accordion
      key={row.siteId}
      expanded={expanded === row.siteId}
      onChange={handleExpand(row.siteId)}
      disableGutters
    >
      <AccordionSummary expandIcon={<IconButton size="small"><ExpandMoreIcon /></IconButton>}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography
            variant="body1"
            sx={{
              maxWidth: '60%',
              pr: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.siteName || row.siteId}
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {INR.format(row.total)}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        {s?.loading ? (
          <Stack spacing={1}>
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} />
          </Stack>
        ) : s?.error ? (
          <Typography color="error">{s.error}</Typography>
        ) : s?.summary ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Monthly breakdown
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Stack spacing={0.5}>
              {(s.summary.monthly || []).map((m) => (
                <Stack
                  key={`${m.year}-${m.month}`}
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography variant="body2">
                    {`${m.year}-${String(m.month).padStart(2, '0')}`}
                  </Typography>
                  <Typography variant="body2">{INR.format(m.total)}</Typography>
                </Stack>
              ))}
              {(!s.summary.monthly || s.summary.monthly.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No payments in this FY for this site
                </Typography>
              )}
            </Stack>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Expand to load details…
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
})}



      {/* <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Stack spacing={1}><Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} /></Stack>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (data?.sites?.length ? (
          <Stack>
            {data.sites.map((row) => {
                console.log(siteDetails);
              const s = siteDetails[row.siteId];
              return (
                <Accordion
                  key={row.siteId}
                  expanded={expanded === row.siteId}
                  onChange={handleExpand(row.siteId)}
                  disableGutters
                >
                  <AccordionSummary expandIcon={<IconButton size="small"><ExpandMoreIcon /></IconButton>}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                      <Typography variant="body1" sx={{ maxWidth: '60%', pr: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.siteId}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">{INR.format(row.total)}</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {s?.loading ? (
                      <Stack spacing={1}><Skeleton height={20} /><Skeleton height={20} /><Skeleton height={20} /></Stack>
                    ) : s?.error ? (
                      <Typography color="error">{s.error}</Typography>
                    ) : s?.summary ? (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Monthly breakdown</Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Stack spacing={0.5}>
                          {(s.summary.monthly || []).map((m) => (
                            <Stack key={`${m.year}-${m.month}`} direction="row" justifyContent="space-between">
                              <Typography variant="body2">{`${m.year}-${String(m.month).padStart(2, '0')}`}</Typography>
                              <Typography variant="body2">{INR.format(m.total)}</Typography>
                            </Stack>
                          ))}
                          {(!s.summary.monthly || s.summary.monthly.length === 0) && (
                            <Typography variant="body2" color="text.secondary">No payments in this FY for this site</Typography>
                          )}
                        </Stack>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Expand to load details…</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">No revenue found</Typography>
        ))}
      </Paper> */}
    </Box>
  );
}
