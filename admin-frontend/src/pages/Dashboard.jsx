import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  useTheme,
  Skeleton,
  Alert,
  IconButton,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeopleIcon from "@mui/icons-material/People";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import StorageIcon from "@mui/icons-material/Storage";
import BarChartIcon from "@mui/icons-material/BarChart";
import { ListItemButton } from '@mui/material';
import { useNavigate } from "react-router-dom";
// Removed charts & timeline imports
import { fetchSites } from "../api/sites";

export default function Dashboard() {
  const theme = useTheme();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [planFilter, setPlanFilter] = useState("all");


  const navigate = useNavigate();
const getSiteId = (s) => s?.id ?? s?._id;

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await fetchSites();
      setSites(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await load();
    })();
    return () => {
      active = false;
    };
  }, []);

  // Helpers
  const msPerDay = 24 * 60 * 60 * 1000;

  const toDate = (v) => {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  };

  const addMonths = (date, months) => {
    if (!date || isNaN(date.getTime())) return null;
    const d = new Date(date.getTime());
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const diffDays = (a, b) => {
    if (!a || !b) return null;
    const end = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const start = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((end.getTime() - start.getTime()) / msPerDay);
  };

  const getStartDate = (s) =>
    toDate(s.plan_started_at) ||
    toDate(s.subscription_start) ||
    toDate(s.created_at) ||
    toDate(s.updated_at);

  const planPricing = {
    basic: { monthlyPrice: 0, billingMonths: 6 },
    professional: { monthlyPrice: 1099, billingMonths: 12 },
    enterprise: { monthlyPrice: 0, billingMonths: 12 },
    premium: { monthlyPrice: 1599, billingMonths: 12 },
    ultimate: { monthlyPrice: 2599, billingMonths: 12 },
  };

  const getPlanKey = (s) => (s.plan || "").toString().toLowerCase();

  const getExpiryDate = (s) => {
    const plan = planPricing[getPlanKey(s)];
    const months = plan?.billingMonths || 0;
    const start = getStartDate(s);
    return months > 0 && start ? addMonths(start, months) : null;
  };

  const getTrialRemainingDays = (s) => {
    const created = toDate(s.created_at) || toDate(s.updated_at);
    if (!created) return null;
    const today = new Date();
    const daysSince = diffDays(today, created);
    if (daysSince == null) return null;
    const totalTrial = 14;
    const remaining = totalTrial - daysSince;
    return remaining;
  };

  // Filtered sites (quick plan filter)
  const filteredSites = useMemo(() => {
    if (planFilter === "all") return sites;
    return sites.filter((s) => getPlanKey(s) === planFilter);
  }, [sites, planFilter]);

  // Metrics
  const totalSites = useMemo(() => filteredSites.length, [filteredSites]);
  const totalUsers = useMemo(
    () => filteredSites.reduce((sum, s) => sum + (s.user || 0), 0),
    [filteredSites]
  );

  const plansCount = useMemo(() => {
    return filteredSites.reduce((acc, s) => {
      const plan = getPlanKey(s) || "unknown";
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});
  }, [filteredSites]);

  const activePlans = useMemo(
    () => filteredSites.reduce((sum, s) => sum + (s.plan ? 1 : 0), 0),
    [filteredSites]
  );

  // MRR & ARR
  const mrr = useMemo(() => {
    return filteredSites.reduce((sum, s) => {
      const p = planPricing[getPlanKey(s)];
      return sum + (p ? p.monthlyPrice : 0);
    }, 0);
  }, [filteredSites]);

  const arr = useMemo(() => mrr * 12, [mrr]);

  const formatINR = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  // Status lists
  const recentSites = useMemo(() => {
    const copy = [...filteredSites];
    copy.sort(
      (a, b) =>
        (toDate(b.created_at) || toDate(b.updated_at) || 0) -
        (toDate(a.created_at) || toDate(a.updated_at) || 0)
    );
    return copy.slice(0, 8);
  }, [filteredSites]);

  const trialSites = useMemo(() => {
    return filteredSites
      .map((s) => {
        const remaining = getTrialRemainingDays(s);
        return { ...s, trialRemainingDays: remaining };
      })
      .filter((s) => s.trialRemainingDays != null && s.trialRemainingDays > 0)
      .sort((a, b) => a.trialRemainingDays - b.trialRemainingDays)
      .slice(0, 12);
  }, [filteredSites]);

  const expiredSites = useMemo(() => {
    const now = new Date();
    return filteredSites
      .map((s) => {
        const expiry = getExpiryDate(s);
        const daysPast = expiry ? diffDays(now, expiry) : null;
        return { ...s, expiryDate: expiry, daysPastExpiry: daysPast };
      })
      .filter((s) => s.expiryDate && s.daysPastExpiry != null && s.daysPastExpiry > 0)
      .sort((a, b) => b.daysPastExpiry - a.daysPastExpiry)
      .slice(0, 12);
  }, [filteredSites]);

  const nearRenewalSites = useMemo(() => {
    const now = new Date();
    return filteredSites
      .map((s) => {
        const expiry = getExpiryDate(s);
        const daysToExpiry = expiry ? diffDays(expiry, now) : null;
        return { ...s, expiryDate: expiry, daysToExpiry };
      })
      .filter(
        (s) =>
          s.expiryDate &&
          s.daysToExpiry != null &&
          s.daysToExpiry > 0 &&
          s.daysToExpiry <= 60
      )
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
      .slice(0, 12);
  }, [filteredSites]);

  const cardHeight = 180;

  const StatCard = ({ icon, label, value, extra }) => (
    <Paper
      elevation={6}
      sx={{
        minWidth: 420,
        width: "100%",
        height: cardHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2.5,
        borderRadius: 3,
        boxShadow: "0px 6px 24px rgba(40,40,40,0.10)",
        transition: "transform 0.15s cubic-bezier(.17,.67,.83,.67)",
        bgcolor: "background.paper",
        "&:hover": {
          transform: "translateY(-4px) scale(1.03)",
          boxShadow: "0px 12px 36px rgba(40,40,40,0.14)",
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

const DataCard = ({ title, items, renderSecondary, emptyText = "No data" }) => (
  <Paper elevation={6} sx={{ p: 2, borderRadius: 3, boxShadow: "0px 6px 24px rgba(40,40,40,0.10)", minHeight: 360 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
    {loading ? (
      <Stack spacing={1}>
        <Skeleton variant="rounded" height={36} />
        <Skeleton variant="rounded" height={36} />
        <Skeleton variant="rounded" height={36} />
      </Stack>
    ) : items && items.length ? (
      <Stack spacing={0.5}>
        {items.map((s, i) => {
          const siteId = getSiteId(s);
          return (
            <ListItemButton
              key={siteId ?? s.name ?? i}
              onClick={() => siteId && navigate(`/sites/${siteId}`, { state: s })}
              sx={{
                borderRadius: 1,
                px: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                <Stack>
                  <Typography variant="body2" fontWeight={600}>
                    {s.name || `Site ${i + 1}`}
                  </Typography>
                  {renderSecondary ? renderSecondary(s) : null}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {s.plan ? String(s.plan) : "—"}
                </Typography>
              </Stack>
            </ListItemButton>
          );
        })}
      </Stack>
    ) : (
      <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
    )}
  </Paper>
);

  const cards = [
    {
      icon: <StorageIcon sx={{ fontSize: 40, color: "black" }} />,
      label: "Total Sites",
      value: totalSites,
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: "black" }} />,
      label: "Total Users",
      value: totalUsers,
    },
    {
      icon: <MonetizationOnIcon sx={{ fontSize: 40, color: "black" }} />,
      label: "Active Plans",
      value: activePlans,
      extra: (
        <Typography variant="subtitle2" color="text.secondary" mt={1}>
          Basic: {plansCount.basic || 0} • Pro: {plansCount.professional || 0} •
          Premium: {plansCount.premium || 0} • Ult: {plansCount.ultimate || 0}
        </Typography>
      ),
    },
    {
      icon: <BarChartIcon sx={{ fontSize: 40, color: "black" }} />,
      label: "Revenue",
      value: (
        <>
          {formatINR.format(mrr)} MRR <br />
          {formatINR.format(arr)} ARR
        </>
      ),
      extra: (
        <Typography variant="caption" color="text.secondary" mt={0.5}>
          Basic: 6mo • Pro/Ent/Prem/Ult: 12mo billing
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="h4" fontWeight="bold">
          ERPEaz Admin Dashboard
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label="All"
            size="small"
            color={planFilter === "all" ? "primary" : "default"}
            onClick={() => setPlanFilter("all")}
          />
          {["basic", "professional", "premium", "ultimate", "enterprise"].map(
            (p) => (
              <Chip
                key={p}
                label={p}
                size="small"
                color={planFilter === p ? "primary" : "default"}
                onClick={() => setPlanFilter(p)}
              />
            )
          )}
          <IconButton aria-label="Refresh" onClick={load}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
        {lastUpdated
          ? `Last updated: ${lastUpdated.toLocaleString()}`
          : "Loading…"}
      </Typography>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load data. Please retry or check your network.
        </Alert>
      )}

      {/* Top stats */}
      <Grid container spacing={3} alignItems="justify" sx={{ width: "100%", mb: 3 }}>
        {cards.map((card, idx) => (
          <Grid key={idx} item xs={12} sm={6} md={3} lg={4}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>



      {/* New data cards */}
      <Grid container spacing={3}  >
        <Grid item xs={12} md={6} lg={6} sx={{minWidth:250}} >
          <DataCard
            title="Recently Created"
            items={recentSites}
            renderSecondary={(s) => {
              const created = toDate(s.created_at) || toDate(s.updated_at);
              return (
                <Typography variant="caption" color="text.secondary">
                  {created
                    ? `Created: ${created.toLocaleDateString()}`
                    : "Created: —"}
                </Typography>
              );
            }}
            emptyText="No recent sites"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={6} sx={{minWidth:250}}>
          <DataCard
            title="In Trial"
            items={trialSites}
            renderSecondary={(s) => (
              <Typography variant="caption" color="warning.main">
                {s.trialRemainingDays} days remaining
              </Typography>
            )}
            emptyText="No active trials"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={6} sx={{minWidth:250}}>
          <DataCard
            title="Expired Plans"
            items={expiredSites}
            renderSecondary={(s) => (
              <Typography variant="caption" color="error.main">
                Expired {s.daysPastExpiry} days ago
              </Typography>
            )}
            emptyText="No expired plans"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={6} sx={{minWidth:250}}>
          <DataCard
            title="Upcoming Renewals "
            items={nearRenewalSites}
            renderSecondary={(s) => (
              <Typography variant="caption" color="primary.main">
                Renews in {s.daysToExpiry} days
              </Typography>
            )}
            emptyText="No renewals within 60 days"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
