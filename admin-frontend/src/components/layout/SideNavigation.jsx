import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Tooltip,
  Box,
  IconButton,
} from '@mui/material';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import {
  Dashboard as DashboardIcon,
  TableRows as TableRowsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 240;
const collapsedWidth = 68;

export default function SideNavigation({
  collapsed,
  onCollapseToggle,
  onLogout,
  mobileOpen,
  onMobileClose,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOpen = !collapsed;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Sites', path: '/sites', icon: <TableRowsIcon /> },
    { label: 'Revenue', path: '/revenue', icon: <CurrencyRupeeIcon /> },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          px: 1,
          display: 'flex',
          justifyContent: isOpen ? 'space-between' : 'center',
          alignItems: 'center',
        }}
      >
        {isOpen && (
          <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.2rem' }}>
            Admin Panel
          </Box>
        )}

        <IconButton size="small" onClick={onCollapseToggle} aria-label={isOpen ? 'Collapse drawer' : 'Expand drawer'}>
          {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {navItems.map(({ label, path, icon }) => {
          const selected = location.pathname.startsWith(path);
          const listItem = (
            <ListItemButton
              key={path}
              selected={selected}
              onClick={() => {
                navigate(path);
                if (onMobileClose) onMobileClose();
              }}
              sx={{
                justifyContent: isOpen ? 'initial' : 'center',
                px: 2,
                my: 0.25,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isOpen ? 2 : 'auto',
                  justifyContent: 'center',
                  color: selected ? 'primary.main' : 'inherit',
                }}
              >
                {icon}
              </ListItemIcon>
              {isOpen && <ListItemText primary={label} />}
            </ListItemButton>
          );

          return isOpen ? (
            listItem
          ) : (
            <Tooltip key={path} title={label} placement="right" arrow>
              <Box>{listItem}</Box>
            </Tooltip>
          );
        })}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        {isOpen ? (
          <ListItemButton onClick={onLogout} sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: 'error.main' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        ) : (
          <Tooltip title="Logout" placement="right" arrow>
            <ListItemButton onClick={onLogout} sx={{ justifyContent: 'center' }}>
              <ListItemIcon sx={{ minWidth: 0, color: 'error.main' }}>
                <LogoutIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open={isOpen}
        sx={{
          width: isOpen ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isOpen ? drawerWidth : collapsedWidth,
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }),
          },
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
