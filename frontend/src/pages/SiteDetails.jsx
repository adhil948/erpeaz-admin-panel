// src/pages/SiteDetails.jsx
import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Divider,
  Stack,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { fetchSiteById } from "../api/sites";
import ExpensesSection from "../components/ExpensesSection";
import RevenueSection from "../components/revenueSection";
import {
  fetchSubscription,
  initSubscription,
  renewSubscription,
} from "../api/subscription";

import {
  computeExpiry,
  planMonths,
} from "../utils/subscription";

export default function SiteDetails() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = React.useState(state || null);
  const [loading, setLoading] = React.useState(!state);
  const [error, setError] = React.useState(null);

  const [sub, setSub] = React.useState(null);
  const [subLoading, setSubLoading] = React.useState(true);
  const [subError, setSubError] = React.useState(null);

  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmKind, setConfirmKind] = React.useState(null); // 'init' | 'renew'

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const siteUrlDisplay = (value) => {
    if (!value) return "—";
    if (typeof value === "string") return value;
    return value.site_url || value.url || value._id || "—";
  };

  // Load site
  React.useEffect(() => {
    if (site) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSiteById(id);
        if (active) setSite(data);
      } catch {
        setError("Failed to load site");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, site]);

  // Load subscription
  React.useEffect(() => {
    if (!site) return;
    let active = true;
    (async () => {
      try {
        setSubLoading(true);
        setSubError(null);
        const s = await fetchSubscription(site._id || id);
        if (active) setSub(s);
      } catch {
        setSubError("Failed to load subscription");
      } finally {
        if (active) setSubLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [site, id]);

  // Derived plan/trial/expiry
  const planKey = String(site?.plan || "").toLowerCase();
  const siteId = site?._id || id;

  const { effectiveExpiry, trialEnds, daysToExpiry, isExpired } = computeExpiry({
    createdAt: site?.created_at,
    planKey,
    subscription: sub,
  });

  // Actions
  const doInit = async () => {
    const payload = {
      plan_key: planKey,
      start_at: site?.created_at || new Date().toISOString(),
    };
    const created = await initSubscription(siteId, payload);
    setSub(created);
  };

  const doRenew = async () => {
    const months = planMonths(planKey);
    const updated = await renewSubscription(siteId, { months });
    setSub(updated);
  };

  // Confirmation handlers
  const openConfirmInit = () => {
    setConfirmKind("init");
    setConfirmOpen(true);
  };
  const openConfirmRenew = () => {
    setConfirmKind("renew");
    setConfirmOpen(true);
  };
  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setConfirmKind(null);
  };
  const handleConfirmProceed = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      if (confirmKind === "init") {
        await doInit();
      } else if (confirmKind === "renew") {
        await doRenew();
      }
      handleConfirmClose();
    } catch {
      setSaveError(
        confirmKind === "init"
          ? "Failed to initialize subscription"
          : "Failed to renew plan"
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading/error states
  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <Typography>Loading…</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  if (!site) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <Typography>No data found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} sx={{ maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h5" fontWeight="medium">Site Details</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Back</Button>
          {sub ? (
            <Button variant="contained" color="primary" size="small" onClick={openConfirmRenew} disabled={saving || subLoading}>
              Renew Plan
            </Button>
          ) : (
            <Button variant="contained" color="primary" size="small" onClick={openConfirmInit} disabled={saving || subLoading}>
              Initialize Subscription
            </Button>
          )}
        </Stack>
      </Stack>

      {saveError && (
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 2 }}>
          <Alert severity="error" variant="outlined">{saveError}</Alert>
        </Box>
      )}
      {subError && (
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 2 }}>
          <Alert severity="warning" variant="outlined">{subError}</Alert>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleConfirmClose}>
        <DialogTitle>
          {confirmKind === "init" ? "Initialize subscription?" : "Renew plan?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmKind === "init"
              ? `This will create a subscription for “${site?.name || "site"}” with plan “${planKey || "plan"}”.`
              : `This will extend the current “${planKey || "plan"}” by ${planMonths(planKey)} months from ${
                  effectiveExpiry && effectiveExpiry > new Date()
                    ? `its current expiry (${formatDate(effectiveExpiry)})`
                    : "today"
                }.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirmProceed} variant="contained" color="primary" disabled={saving} autoFocus>
            {confirmKind === "init" ? "Initialize" : "Confirm Renew"}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                {effectiveExpiry && (
                  <Chip
                    label={`${planKey || "plan"} ends: ${formatDate(effectiveExpiry)} ${
                      daysToExpiry >= 0
                        ? `(${daysToExpiry} days left)`
                        : `(expired ${Math.abs(daysToExpiry)} days ago)`
                    }`}
                    size="small"
                    variant="outlined"
                    color={daysToExpiry >= 0 ? "warning" : "error"}
                    sx={{ height: "auto", px: 1, textTransform: "capitalize" }}
                  />
                )}
                <Typography variant="h6" fontWeight="medium">{site.name || "Unnamed"}</Typography>
                <Chip label={site.plan || "No Plan"} size="small" sx={{ height: "auto", px: 1 }} />
                <Chip
                  label={trialEnds && new Date() <= trialEnds ? "Trial" : "Active"}
                  color={trialEnds && new Date() <= trialEnds ? "warning" : "success"}
                  size="small"
                  sx={{ height: "auto", px: 1 }}
                />
                {site.created_at && (
                  <Chip label={`Registered: ${formatDate(site.created_at)}`} size="small" variant="outlined" sx={{ height: "auto", px: 1 }} />
                )}
                {trialEnds && (
                  <Chip label={`Trial ends: ${formatDate(trialEnds)}`} size="small" variant="outlined" color="warning" sx={{ height: "auto", px: 1 }} />
                )}
              </Stack>
            </Paper>
            {effectiveExpiry && (
              <Box sx={{ mt: 2 }}>
                <Paper elevation={0} sx={{ p: 0 }}>
                  <Alert
                    severity={isExpired ? "error" : daysToExpiry <= 30 ? "warning" : "info"}
                    variant="outlined"
                  >
                    {isExpired
                      ? `Plan expired ${Math.abs(daysToExpiry)} days ago on ${formatDate(effectiveExpiry)}.`
                      : `Plan ends on ${formatDate(effectiveExpiry)} — ${daysToExpiry} days remaining.`}
                  </Alert>
                </Paper>
              </Box>
            )}
          </Grid>

          {/* Organization details */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Organization Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Company</Typography>
                  <Typography variant="body1">{site.company_name || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Address</Typography>
                  <Typography variant="body1">{site.company_address || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Email</Typography>
                  <Typography variant="body1">{site.email || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Phone</Typography>
                  <Typography variant="body1">{site.phone_number || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Country</Typography>
                  <Typography variant="body1">{site.country || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Users</Typography>
                  <Typography variant="body1">{site.user ?? "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Username</Typography>
                  <Typography variant="body1">{site.user_name || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>Site URL/ID</Typography>
                  <Typography variant="body1">{siteUrlDisplay(site.site_url)}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <RevenueSection siteId={siteId} />
          </Grid>

          <Grid item xs={12}>
            <ExpensesSection siteId={siteId} onSummaryChange={() => {}} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
