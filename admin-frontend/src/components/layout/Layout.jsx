import React, { useState } from 'react';
import { Box, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SideNavigation from './SideNavigation';
import AppHeader from './AppHeader';

const drawerWidth = 240;
const collapsedWidth = 68;

export default function Layout({ children, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCollapseToggle = () => setCollapsed((prev) => !prev);
  const handleMobileOpen = () => setMobileOpen(true);
  const handleMobileClose = () => setMobileOpen(false);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const computedWidth = collapsed ? collapsedWidth : drawerWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SideNavigation
        collapsed={collapsed}
        onCollapseToggle={handleCollapseToggle}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      <Box sx={{ flexGrow: 1, width: { sm: `calc(100% - ${computedWidth}px)` } }}>
        <AppHeader onOpenSidebar={handleSidebarToggle} onLogout={onLogout} />

        {/* Toolbar to push content below AppBar */}
        <Toolbar />

        {/* Main Content Area */}
        <Box component="main" sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
