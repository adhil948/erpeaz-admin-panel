// src/pages/SitesTable.jsx
import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Stack,
  Paper,
  Typography,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { fetchSites } from '../api/sites.js';

export default function SitesTable() {
  const navigate = useNavigate();
  const [allRows, setAllRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState('');
  const [plan, setPlan] = React.useState('all');

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const rows = await fetchSites();
        if (active) setAllRows(rows);
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Helper function to check if site is in trial (14 days from creation)
  const isInTrial = (createdAt) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const trialEndDate = new Date(createdDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
    const now = new Date();
    return now <= trialEndDate;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

const MS_14_DAYS = 14 * 24 * 60 * 60 * 1000;

const columns = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'company_name', headerName: 'Company', flex: 1, minWidth: 160 },
  { field: 'plan', headerName: 'Plan', width: 120 },
  { field: 'phone_number', headerName: 'Phone', width: 160 },
  { field: 'user', headerName: 'Users', width: 100, type: 'number' },

  // Date registered: sortable as a date, formatted for display
  {
    field: 'created_at',
    headerName: 'Date Registered',
    type: 'date',
    width: 160,
    // v6/v7 signature: (value, row)
    valueGetter: (value, row) => (row?.created_at ? new Date(row.created_at) : null),
    valueFormatter: (value) =>
      value ? new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
    sortable: true,
  },

  // Trial status: compute boolean, render a Chip
  {
    field: 'trial_status',
    headerName: 'Trial',
    width: 120,
    // return a boolean for sorting/filtering
    valueGetter: (value, row) => {
      if (!row?.created_at) return false;
      const created = new Date(row.created_at).getTime();
      const ends = created + MS_14_DAYS;
      return Date.now() <= ends;
    },
    renderCell: (params) => {
      const inTrial = Boolean(params.value);
      return (
        <Chip
          label={inTrial ? 'Trial' : 'Active'}
          color={inTrial ? 'warning' : 'success'}
          size="small"
          variant="filled"
        />
      );
    },
    sortable: true,
  },
];


  // Convert Mongo _id to DataGrid id
  const rows = React.useMemo(
    () => allRows.map((row) => ({ ...row, id: row._id })),
    [allRows]
  );

  // Search and filtering
  const normalized = (v) => String(v ?? '').toLowerCase();
  const matchesSearch = (r, q) => {
    if (!q) return true;
    const s = normalized(q);
    return (
      normalized(r.name).includes(s) ||
      normalized(r.company_name).includes(s) ||
      normalized(r.email).includes(s) ||
      normalized(r.country).includes(s) ||
      normalized(r.plan).includes(s) ||
      String(r.phone_number ?? '').includes(q)
    );
  };

  const displayRows = React.useMemo(
    () =>
      rows
        .filter((r) => (plan === 'all' ? true : r.plan === plan))
        .filter((r) => matchesSearch(r, search)),
    [rows, plan, search]
  );

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Sites Details
        </Typography>

        <Stack direction="row" spacing={2} mb={2}>
          <TextField
            size="small"
            label="Search"
            color='black'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <TextField
            select
            size="small"
            label="Plan"
            color='black'
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            sx={{ width: 160 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Basic">Basic</MenuItem>
            <MenuItem value="Professional">Professional</MenuItem>
            <MenuItem value="Enterprise">Enterprise</MenuItem>
            <MenuItem value="Ultimate">Ultimate</MenuItem>
            <MenuItem value="Premium">Premium</MenuItem>
          </TextField>
        </Stack>

        <div style={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={displayRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            rowHeight={52}
            headerHeight={56}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
              sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            sx={{
              borderRadius: 2,
              boxShadow: 1,
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'rgba(235,237,240,1)'
              }
            }}
            onRowClick={(params) => {
              navigate(`/sites/${params.id}`, { state: params.row });
            }}
          />
        </div>
      </Paper>
    </Box>
  );
}
