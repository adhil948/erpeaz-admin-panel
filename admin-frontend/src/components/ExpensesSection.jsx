// src/components/ExpensesSection.jsx
import React from 'react';
import {
  Paper, Typography, Stack, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  listExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary
} from '../api/expenses';

function currency(n) { return `₹${Number(n || 0).toLocaleString()}`; }

export default function ExpensesSection({ siteId }) {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ amount: '', kind: 'recieved', date: '', note: '' });

  const load = React.useCallback(async () => {
    const [items, sums] = await Promise.all([
      listExpenses(siteId),
      getExpenseSummary(siteId)
    ]);
    setRows(items.map(i => ({ ...i, id: i._id })));
    setSummary(sums);
  }, [siteId]);

  React.useEffect(() => { if (siteId) load(); }, [siteId, load]);

  const cols = [
    { field: 'amount', headerName: 'Amount', width: 120},
    { field: 'kind', headerName: 'Type', width: 120 },
    {
      field: 'date', headerName: 'Date', width: 150, type: 'date',
      valueGetter: (value, row) => (row?.date ? new Date(row.date) : null),
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString('en-IN') : '—')
    },
    { field: 'note', headerName: 'Note', flex: 1, minWidth: 160 },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => onEdit(params.row)}><EditIcon /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(params.row)}><DeleteIcon /></IconButton>
        </>
      )
    }
  ]; // valueGetter/valueFormatter follow current MUI signatures for stable sort/render. [1]

  function openAdd() {
    setEditing(null);
    setForm({ amount: '', kind: 'recieved', date: new Date().toISOString().slice(0, 10), note: '' });
    setOpen(true);
  }
  function onEdit(row) {
    setEditing(row);
    setForm({
      amount: String(row.amount ?? ''),
      kind: row.kind || 'recieved',
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
      note: row.note || ''
    });
    setOpen(true);
  }
// Delete
async function onDelete(row) {
  if (!window.confirm('Delete this expense?')) return;
  await deleteExpense(siteId, row._id);   // CHANGED: include siteId
  await load();
}
async function onSave() {
  setBusy(true);
  const payload = {
    amount: Number(form.amount),
    kind: form.kind,
    date: form.date ? new Date(form.date).toISOString() : undefined,
    note: form.note
  };
  if (editing) {
    await updateExpense(siteId, editing._id, payload);  // CHANGED: include siteId
  } else {
    await createExpense(siteId, payload);
  }
  setBusy(false);
  setOpen(false);
  await load();
}

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1">Payments</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd}>Add Expense</Button>
      </Stack>

      {summary && (
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <Chip label={`Recieved: ${currency(summary.recieved?.total || 0)} (${summary.recieved?.count || 0})`} color="info" />
          {/* <Chip label={`Planned: ${currency(summary.planned?.total || 0)} (${summary.planned?.count || 0})`} color="info" /> */}
          <Chip label={`Due: ${currency(summary.due?.total || 0)} (${summary.due?.count || 0})`} color="error" />
        </Stack>
      )}

      <div style={{ height: 380, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={cols}
          density="compact"
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </div>

      <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField label="Amount" type="number" value={form.amount}
                       onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required />
            <TextField label="Type" select value={form.kind}
                       onChange={(e) => setForm(f => ({ ...f, kind: e.target.value }))}>
              <MenuItem value="recieved">Recieved</MenuItem>
              <MenuItem value="planned">Planned</MenuItem>
              <MenuItem value="due">Due</MenuItem>
            </TextField>
            <TextField label="Date" type="date" value={form.date}
                       onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Note" value={form.note}
                       onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={onSave} variant="contained" disabled={busy}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
