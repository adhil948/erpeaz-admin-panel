// AppHeader.jsx (updated)
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Tooltip,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useDarkMode } from "../ThemeProviderWrapper";
import NotificationsPanel from "./NotificationsPanel";
import { NOTIF_SEVERITY } from "./notifications/types";
import { differenceInDays } from "date-fns";
// AppHeader.jsx (add these imports)
import {
  fetchNotifications,
  connectNotificationStream,
  markAllRead as apiMarkAllRead, // optional if you implement the endpoint
} from "../../api/notifications";
import Logo from "../../assets/Logo.svg";

export default function AppHeader({
  onOpenSidebar,
  notifCount = 0,
  onLogout,
  sites = [],
}) {
  const { mode, toggleMode } = useDarkMode();
  const [profileAnchor, setProfileAnchor] = useState(null);

  // Notifications state
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const navigate = useNavigate();

  // Snackbar state
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: NOTIF_SEVERITY.INFO,
  });
  const openSnack = (message, severity = NOTIF_SEVERITY.INFO) =>
    setSnack({ open: true, message, severity });
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  const addNotification = useCallback((payload) => {
    setNotifications((prev) => [
      {
        id: crypto.randomUUID(),
        severity: payload.severity ?? NOTIF_SEVERITY.INFO,
        title: payload.title ?? "",
        message: payload.message ?? "",
        createdAt: payload.createdAt ?? new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // AppHeader.jsx (keep this effect, ensure the imports exist)
  useEffect(() => {
    // Initial load
    fetchNotifications().then(setNotifications);

    // Live updates
    const disconnect = connectNotificationStream((n) => {
      setNotifications((prev) => [n, ...prev]);
    });

    // Cleanup: close EventSource connection
    return () => {
      if (typeof disconnect === "function") disconnect();
    };
  }, []);

  const openProfileMenu = (event) => setProfileAnchor(event.currentTarget);
  const closeProfileMenu = () => setProfileAnchor(null);

  // Example: call this when a site is added elsewhere in the app
  const onSiteAdded = useCallback(
    (siteName) => {
      addNotification({
        severity: NOTIF_SEVERITY.SUCCESS,
        title: "Site added",
        message: `${siteName} was added successfully.`,
      });
      openSnack("Site added successfully", NOTIF_SEVERITY.SUCCESS);
    },
    [addNotification]
  );

  // Trial checks — call on interval or when sites list updates
  const checkTrials = useCallback(() => {
    const now = new Date();
    sites.forEach((s) => {
      const end = new Date(s.trialStart);
      end.setDate(end.getDate() + (s.trialDays ?? 14));
      const daysLeft = differenceInDays(end, now);

      if (daysLeft <= 0) {
        addNotification({
          severity: NOTIF_SEVERITY.ERROR,
          title: "Trial ended",
          message: `${s.name}'s trial has ended.`,
        });
        openSnack(`${s.name}'s trial has ended`, NOTIF_SEVERITY.ERROR);
      } else if (daysLeft <= 3) {
        addNotification({
          severity: NOTIF_SEVERITY.WARNING,
          title: "Trial ending soon",
          message: `${s.name}'s trial ends in ${daysLeft} day(s).`,
        });
      }
    });
  }, [sites, addNotification]);

  return (
<>
  <AppBar
    position="fixed"
    color="primary"
    elevation={0}
    sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
  >
    <Toolbar sx={{ pr: 2 }}>
      {/* Menu button */}
      <IconButton
        edge="start"
        color="inherit"
        onClick={onOpenSidebar}
        sx={{ mr: 2, display: { sm: "block" } }}
        aria-label="toggle drawer"
      >
        <MenuIcon />
      </IconButton>

      {/* Logo */}
      <Box
        component="img"
        src={Logo}
        alt="Logo"
        sx={{ height: 40, cursor: "pointer" }}
        onClick={() => {
                navigate('/dashboard');}}
      />

      {/* Spacer pushes everything else to the right */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Search box */}
      {/* <Box
        sx={{
          position: "relative",
          borderRadius: 1,
          backgroundColor: alpha("#fff", 0.15),
          "&:hover": { backgroundColor: alpha("#fff", 0.25) },
          width: { xs: "0", sm: "auto" },
          transition: "width 0.3s",
          mr: 2,
          display: { xs: "none", sm: "block" },
        }}
      >
        <Box
          sx={{
            pl: 2,
            pr: 1,
            height: "100%",
            position: "absolute",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          🔍
        </Box>
        <InputBase
          placeholder="Search…"
          sx={{
            color: "inherit",
            pl: 5,
            width: 220,
            transition: "width 0.3s",
          }}
          inputProps={{ "aria-label": "search" }}
        />
      </Box> */}

      {/* Theme toggle */}
      <Tooltip title="Toggle light/dark theme">
        <IconButton color="inherit" onClick={toggleMode} sx={{ ml: 1 }}>
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Tooltip>

      {/* Notifications */}
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          sx={{ ml: 1 }}
          onClick={async () => {
            setNotifPanelOpen(true);
            markAllRead();
            try {
              await apiMarkAllRead();
            } catch (e) {
              console.log("markread error");
            }
          }}
        >
          <Badge badgeContent={unreadCount} color="secondary" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Profile */}
      <Tooltip title="Profile">
        <IconButton
          color="inherit"
          sx={{ ml: 1 }}
          onClick={openProfileMenu}
        >
          <Avatar sx={{ bgcolor: "secondary.main" }}>A</Avatar>
        </IconButton>
      </Tooltip>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={closeProfileMenu}
      >
        <MenuItem onClick={closeProfileMenu}>Profile</MenuItem>
        <MenuItem onClick={closeProfileMenu}>Settings</MenuItem>
        <MenuItem
          onClick={() => {
            closeProfileMenu();
            onLogout?.();
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </Toolbar>
  </AppBar>

  {/* Notifications panel */}
  <NotificationsPanel
    open={notifPanelOpen}
    onClose={() => setNotifPanelOpen(false)}
    notifications={notifications}
    onMarkAllRead={markAllRead}
  />

  {/* Snackbar alerts */}
  <Snackbar
    open={snack.open}
    autoHideDuration={4000}
    onClose={(_, reason) => {
      if (reason === "clickaway") return;
      closeSnack();
    }}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  >
    <Alert
      onClose={closeSnack}
      severity={snack.severity}
      variant="filled"
      sx={{ width: "100%" }}
    >
      {snack.message}
    </Alert>
  </Snackbar>
</>

  );
}
