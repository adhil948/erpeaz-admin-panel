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
  Card,
  CardContent,
} from "@mui/material";
import { Alert } from "@mui/material";
import { fetchSiteById } from "../api/sites";
import ExpensesSection from "../components/ExpensesSection";
import RevenueSection from "../components/revenueSection"; 

const MS_14_DAYS = 14 * 24 * 60 * 60 * 1000;

function isInTrial(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return Date.now() <= created + MS_14_DAYS;
}

function formatDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// NEW: robust helpers for safe rendering
function siteUrlDisplay(value) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  // common nested shapes: { site_url, _id, status, progress }
  return value.site_url || value.url || value._id || "—";
}
function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

export default function SiteDetails() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = React.useState(state || null);
  const [loading, setLoading] = React.useState(!state);
  const [error, setError] = React.useState(null);
  const [totalRevenue, setTotalRevenue] = React.useState(0);
  const [arpu, setArpu] = React.useState(0);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const handleSummaryChange = React.useCallback(
    (sums) => {
      const received = sums?.received?.total ?? null;
      const spent = sums?.spent?.total ?? 0;
      const revenue = received != null ? received : spent;
      setTotalRevenue(revenue);

      const users = Number(site?.user || 0);
      setArpu(users > 0 ? Math.round(revenue / users) : 0);
    },
    [site?.user]
  );

  // Date helpers
  function toDateSafe(v) {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }

  function addDays(date, days) {
    if (!date || isNaN(date.getTime())) return null;
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function addMonths(date, months) {
    if (!date || isNaN(date.getTime())) return null;
    const d = new Date(date.getTime());
    d.setMonth(d.getMonth() + months); // handles month/year rollover
    return d;
  }

  function daysDiff(to, from) {
    if (!to || !from) return null;
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    return Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);
  }

  React.useEffect(() => {
    if (site) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSiteById(id);
        if (active) setSite(data);
      } catch (e) {
        setError("Failed to load site");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, site]);

  // Plan/trial logic
  const planKey = String(site?.plan || "").toLowerCase();

  const createdAt = site?.created_at;
  const createdAtDate = toDateSafe(createdAt);
  const trial = isInTrial(createdAt);
  const trialEnds = createdAtDate ? addDays(createdAtDate, 14) : null;

  // 6 months for basic starts AFTER the 14-day trial ends (trialEnds + 6 months)
  // Fallback to previous start logic if trialEnds is unavailable
  const basicStartFallback =
    toDateSafe(site?.plan_started_at) ||
    toDateSafe(site?.subscription_start) ||
    createdAtDate ||
    toDateSafe(site?.updated_at);

  const basicExpiry =
    planKey === "basic"
      ? trialEnds
        ? addMonths(trialEnds, 6)
        : basicStartFallback
        ? addMonths(basicStartFallback, 6)
        : null
      : null;

  const daysToBasicExpiry = basicExpiry ? daysDiff(basicExpiry, new Date()) : null;
  const basicExpired = daysToBasicExpiry != null && daysToBasicExpiry < 0;

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <Typography>Loading…</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  if (!site) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <Typography>No data found</Typography>
      </Box>
    );
  }

  const siteId = site?._id || id;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        sx={{ maxWidth: 1200, mx: "auto" }}
      >
        <Typography variant="h5" fontWeight="medium">
          Site Details
        </Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Grid container spacing={3}>
          {/* Summary header */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                {planKey === "basic" && basicExpiry && (
                  <Chip
                    label={`Basic ends: ${formatDate(basicExpiry)} ${
                      daysToBasicExpiry >= 0
                        ? `(${daysToBasicExpiry} days left)`
                        : `(expired ${Math.abs(daysToBasicExpiry)} days ago)`
                    }`}
                    size="small"
                    variant="outlined"
                    color={daysToBasicExpiry >= 0 ? "warning" : "error"}
                    sx={{ height: "auto", px: 1 }}
                  />
                )}
                <Typography variant="h6" fontWeight="medium">
                  {site.name || "Unnamed"}
                </Typography>
                <Chip
                  label={site.plan || "No Plan"}
                  size="small"
                  sx={{ height: "auto", px: 1 }}
                />
                <Chip
                  label={trial ? "Trial" : "Active"}
                  color={trial ? "warning" : "success"}
                  size="small"
                  sx={{ height: "auto", px: 1 }}
                />
                {createdAt && (
                  <Chip
                    label={`Registered: ${formatDate(createdAt)}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: "auto", px: 1 }}
                  />
                )}
                {trialEnds && (
                  <Chip
                    label={`Trial ends: ${formatDate(trialEnds)}`}
                    size="small"
                    variant="outlined"
                    color="warning"
                    sx={{ height: "auto", px: 1 }}
                  />
                )}
              </Stack>
            </Paper>

            {planKey === "basic" && basicExpiry && (
              <Box sx={{ mt: 2 }}>
                <Paper elevation={0} sx={{ p: 0 }}>
                  <Alert
                    severity={
                      basicExpired
                        ? "error"
                        : daysToBasicExpiry <= 30
                        ? "warning"
                        : "info"
                    }
                    variant="outlined"
                  >
                    {basicExpired
                      ? `Basic plan expired ${Math.abs(
                          daysToBasicExpiry
                        )} days ago on ${formatDate(basicExpiry)}.`
                      : `Basic plan ends on ${formatDate(
                          basicExpiry
                        )} — ${daysToBasicExpiry} days remaining.`}
                  </Alert>
                </Paper>
              </Box>
            )}
          </Grid>

          {/* Left: Organization details */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Organization Details
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Company
                  </Typography>
                  <Typography variant="body1">
                    {site.company_name || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Address
                  </Typography>
                  <Typography variant="body1">
                    {site.company_address || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Email
                  </Typography>
                  <Typography variant="body1">{site.email || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Phone
                  </Typography>
                  <Typography variant="body1">
                    {site.phone_number || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Country
                  </Typography>
                  <Typography variant="body1">{site.country || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Users
                  </Typography>
                  <Typography variant="body1">{site.user ?? "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {site.user_name || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Site URL/ID
                  </Typography>
                  {/* SAFE: string when string, else pick best field */}
                  <Typography variant="body1">
                    {siteUrlDisplay(site.site_url)}
                  </Typography>
                  {/* Optional extra chips when site_url is an object */}
                  {/* {isPlainObject(site.site_url) && (
                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                      {"status" in site.site_url && (
                        <Chip
                          size="small"
                          label={`Status: ${String(site.site_url.status ?? "—")}`}
                        />
                      )}
                      {"progress" in site.site_url && (
                        <Chip
                          size="small"
                          label={`Progress: ${String(site.site_url.progress ?? "—")}`}
                        />
                      )}
                      {"_id" in site.site_url && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`ID: ${String(site.site_url._id ?? "—")}`}
                        />
                      )}
                    </Stack>
                  )} */}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right: Business metrics */}
          {/* <Grid item xs={12} md={5}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Business Metrics
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      Total Revenue
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      ₹{Number(totalRevenue || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      ARPU
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      ₹{Number(arpu || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      Status
                    </Typography>
                    <Chip
                      label={trial ? "Trial" : "Active"}
                      color={trial ? "warning" : "success"}
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid> */}

          <Grid item xs={12}>
  <RevenueSection siteId={siteId} />
</Grid>

          {/* Full-width: Expenses (reusable) */}
          <Grid item xs={12}>
            <ExpensesSection
              siteId={siteId}
              onSummaryChange={handleSummaryChange}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
