// AppHeader.jsx
import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useDarkMode } from '../ThemeProviderWrapper';

export default function AppHeader({ onOpenSidebar, notifCount = 0, onLogout }) {
  const { mode, toggleMode } = useDarkMode();
  const [profileAnchor, setProfileAnchor] = useState(null);

  const openProfileMenu = (event) => setProfileAnchor(event.currentTarget);
  const closeProfileMenu = () => setProfileAnchor(null);

  return (
    <AppBar position="fixed" color="primary" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ pr: 2 }}>
<IconButton
  edge="start"
  color="inherit"
  onClick={onOpenSidebar}  // <-- Toggle drawer here
  sx={{ mr: 2, display: { sm: 'block' } }} // Show on desktop & mobile
  aria-label="toggle drawer"
>
  <MenuIcon />
</IconButton>


        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          Admin Dashboard
        </Typography>

        <Box
          sx={{
            position: 'relative',
            borderRadius: 1,
            backgroundColor: alpha('#fff', 0.15),
            '&:hover': { backgroundColor: alpha('#fff', 0.25) },
            width: { xs: '0', sm: 'auto' },
            transition: 'width 0.3s',
            mr: 2,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Box sx={{ pl: 2, pr: 1, height: '100%', position: 'absolute', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            🔍
          </Box>
          <InputBase
            placeholder="Search…"
            sx={{ color: 'inherit', pl: 5, width: 220, transition: 'width 0.3s' }}
            inputProps={{ 'aria-label': 'search' }}
          />
        </Box>

        <Tooltip title="Toggle light/dark theme">
          <IconButton color="inherit" onClick={toggleMode} sx={{ ml: 1 }}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton color="inherit" sx={{ ml: 1 }}>
            <Badge badgeContent={notifCount} color="secondary" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Profile">
          <IconButton color="inherit" sx={{ ml: 1 }} onClick={openProfileMenu}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar>
          </IconButton>
        </Tooltip>

        <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={closeProfileMenu}>
          <MenuItem onClick={closeProfileMenu}>Profile</MenuItem>
          <MenuItem onClick={closeProfileMenu}>Settings</MenuItem>
          <MenuItem
            onClick={() => {
              closeProfileMenu();
              onLogout();
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
