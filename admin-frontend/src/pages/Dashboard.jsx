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
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeopleIcon from "@mui/icons-material/People";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import StorageIcon from "@mui/icons-material/Storage";
import BarChartIcon from "@mui/icons-material/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from "@mui/lab";
import { fetchSites } from "../api/dashboard";
import { Margin } from "@mui/icons-material";

export default function Dashboard() {
  const theme = useTheme();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [planFilter, setPlanFilter] = useState("all");

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
      console.log(sites);
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

  // Filtered sites (quick plan filter)
  const filteredSites = useMemo(() => {
    if (planFilter === "all") return sites;
    return sites.filter((s) => (s.plan || "").toLowerCase() === planFilter);
  }, [sites, planFilter]);

  const istrial = (updated_at) => {
    if (!updated_at) return false;
    const createdDate = new Date(updated_at);
    const trialEndDate = new Date(
      createdDate.getTime() + 14 * 24 * 60 * 60 * 1000
    );
    if (new Date() <= trialEndDate) {
      return true;
      console.log("trial");
    }
    return false;
    console.log("false");
  };

  // Metrics
  const totalSites = useMemo(() => filteredSites.length, [filteredSites]);
  const totalUsers = useMemo(
    () => filteredSites.reduce((sum, s) => sum + (s.user || 0), 0),
    [filteredSites]
  );

  const plansCount = useMemo(() => {
    return filteredSites.reduce((acc, s) => {
      const plan = (s.plan || "unknown").toString().toLowerCase();
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});
  }, [filteredSites]);

  const activePlans = useMemo(
    () => filteredSites.reduce((sum, s) => sum + (s.plan ? 1 : 0), 0),
    [filteredSites]
  );

  const planPricing = {
    basic: { monthlyPrice: 0, billingMonths: 6 },
    professional: { monthlyPrice: 1099, billingMonths: 12 },
    enterprise: { monthlyPrice: 0, billingMonths: 12 },
    premium: { monthlyPrice: 1599, billingMonths: 12 },
    ultimate: { monthlyPrice: 2599, billingMonths: 12 },
  };

  // MRR & ARR
  const mrr = useMemo(() => {
    return filteredSites.reduce((sum, s) => {
      const key = (s.plan || "").toString().toLowerCase();
      const p = planPricing[key];
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
          Basic: 6mo • Pro/Ent: 1yr billing
        </Typography>
      ),
    },
  ];

  // Chart data
  const pieData = useMemo(() => {
    const entries = Object.entries(plansCount);
    const data = entries
      .filter(([k]) => k !== "unknown")
      .map(([k, v]) => ({
        id: k,
        value: v,
        label: k.charAt(0).toUpperCase() + k.slice(1),
      }));
    return data.length ? data : [{ id: "empty", value: 1, label: "No data" }];
  }, [plansCount]);

  // Example: derive a simple MRR history (last 6 points) using static smoothing over current mrr
  // Replace with real timeseries from backend if available.
  const mrrHistory = useMemo(() => {
    const base = mrr;
    return Array.from({ length: 6 }, (_, i) =>
      Math.max(0, Math.round(base * (0.88 + i * 0.024)))
    );
  }, [mrr]);

  // Timeline items (latest 6 by updated_at or fallback)
  const timelineItems = useMemo(() => {
    const copy = [...sites];
    copy.sort(
      (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
    );
    return copy.slice(0, 6);
  }, [sites]);

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="h4" fontWeight="bold">
          Welcome to the Admin Dashboard
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

      <Grid
        container
        spacing={3}
        alignItems="justify"
        sx={{ width: "100%", mb: 3 }}
      >
        {cards.map((card, idx) => (
          <Grid key={idx} item xs={12} sm={6} md={3} lg={4}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={6}>
        {/* Plan Distribution (Donut) */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Plan distribution
          </Typography>
          {loading ? (
            <Skeleton variant="rounded" height={260} />
          ) : (
            <PieChart
              height={460}
              width={460}
              series={[
                {
                  innerRadius: 60,
                  outerRadius: 120,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  arcLabel: (item) => (item.value ? `${item.value}` : ""),
                  arcLabelMinAngle: 10,
                  data: pieData,
                },
              ]}
            />
          )}
        </Grid>

        {/* Revenue Trend */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Revenue trend (MRR)
          </Typography>
          {loading ? (
            <Skeleton variant="rounded" height={260} />
          ) : (
            <LineChart
              height={460}
              width={460}
              series={[{ id: "mrr", data: mrrHistory, label: "MRR" }]}
              xAxis={[
                {
                  data: ["T-5", "T-4", "T-3", "T-2", "T-1", "Now"],
                  scaleType: "point",
                },
              ]}
            />
          )}
        </Grid>

        {/* Recent Activity Timeline */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{ ml: { lg: 34, md: 8, xs: 0 }, minWidth: 350, minHeight: 460 }}
        >
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, minHeight: 500 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Recent activity
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={140} />
            ) : (
              <Timeline position="alternate">
                {timelineItems.map((s, i) => (
                  <TimelineItem key={i}>
                    <TimelineSeparator>
                      <TimelineDot color={s.plan ? "success" : "grey"} />
                      {i < timelineItems.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" fontWeight={600}>
                        {s.name || `Site ${i + 1}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.plan ? `Plan: ${s.plan}` : "No plan"}
                        {"   "}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={istrial ? "warning.main" : "primary.main"}
                      >
                        {istrial ? "Trial" : "Active"}
                      </Typography>

                      <Typography>
                        {s.updated_at
                          ? new Date(s.updated_at).toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              // hour: "2-digit",
                              // minute: "2-digit",
                              hour12: false, // optional → shows AM/PM
                            })
                          : "—"}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
