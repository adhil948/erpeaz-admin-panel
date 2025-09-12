// import React, { useMemo, useState } from 'react';
// import {
//   AppBar,
//   Toolbar,
//   Typography,
//   IconButton,
//   Drawer,
//   List,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Box,
//   CssBaseline,
//   Divider,
//   ThemeProvider,
//   createTheme,
//   Tooltip,
//   Badge,
//   Avatar,
//   Menu,
//   MenuItem,
//   InputBase,
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import MenuIcon from '@mui/icons-material/Menu';
// import DashboardIcon from '@mui/icons-material/Dashboard';
// import TableRowsIcon from '@mui/icons-material/TableRows';
// import LogoutIcon from '@mui/icons-material/Logout';
// import NotificationsIcon from '@mui/icons-material/Notifications';
// import SearchIcon from '@mui/icons-material/Search';
// import Brightness4Icon from '@mui/icons-material/Brightness4';
// import Brightness7Icon from '@mui/icons-material/Brightness7';
// import { useLocation, useNavigate } from 'react-router-dom';

// const drawerWidth = 240;
// const collapsedWidth = 72; // mini variant width

// export default function Layout({ children, onLogout }) {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [collapsed, setCollapsed] = useState(false);
//   const [hovered, setHovered] = useState(false);
//   const [mode, setMode] = useState('light');
//   const [profileEl, setProfileEl] = useState(null);
//   const [notifCount] = useState(5);

//   const navigate = useNavigate();
//   const location = useLocation();

//   const isOpen = !collapsed || hovered;
//   const computedDrawerWidth = isOpen ? drawerWidth : collapsedWidth;

//   const theme = useMemo(
//     () =>
//       createTheme({
//         palette: {
//           mode,
//           primary: { main: '#eeb519ff' },  // orange
//           secondary: { main: '#1976d2' },  // blue
//           background: {
//             default: mode === 'dark' ? '#0f1115' : '#fafafa',
//             paper: mode === 'dark' ? '#111318' : '#ffffff',
//           },
//         },
//         shape: { borderRadius: 12 },
//         components: {
//           MuiAppBar: {
//             styleOverrides: {
//               root: {
//                 backdropFilter: 'saturate(180%) blur(6px)',
//               },
//             },
//           },
//           MuiListItemButton: {
//             styleOverrides: {
//               root: {
//                 margin: '4px 8px',
//                 borderRadius: 10,
//                 '&.Mui-selected': {
//                   backgroundColor: alpha('#1976d2', 0.12),
//                   color: '#1976d2',
//                 },
//                 '&.Mui-selected .MuiListItemIcon-root': {
//                   color: '#1976d2',
//                 },
//               },
//             },
//           },
//           MuiDrawer: {
//             styleOverrides: {
//               paper: {
//                 borderRight: 'none',
//               },
//             },
//           },
//         },
//       }),
//     [mode]
//   );

//   const handleDrawerToggle = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   const handleCollapseToggle = () => {
//     setCollapsed(!collapsed);
//   };

//   const handleOpenProfile = (event) => {
//     setProfileEl(event.currentTarget);
//   };
//   const handleCloseProfile = () => setProfileEl(null);

//   const navItems = [
//     { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
//     { label: 'Sites', icon: <TableRowsIcon />, path: '/sites' },
//   ];

//   const drawer = (
//     <Box
//       sx={{
//         height: '100%',
//         display: 'flex',
//         flexDirection: 'column',
//         background:
//           mode === 'dark'
//             ? 'linear-gradient(180deg, #141820 0%, #0f131a 100%)'
//             : 'linear-gradient(180deg, #fff8e1 0%, #ffffff 40%)',
//       }}
//     >
//       <Toolbar
//         sx={{
//           display: 'flex',
//           justifyContent: isOpen ? 'space-between' : 'center',
//           alignItems: 'center',
//           px: 1,
//         }}
//       >
//         {isOpen && (
//           <Typography variant="h6" noWrap>
//             Admin Panel
//           </Typography>
//         )}
//         <Tooltip title={isOpen ? 'Collapse' : 'Expand'} placement="right">
//           <IconButton onClick={handleCollapseToggle} size="small" color="secondary">
//             <MenuIcon />
//           </IconButton>
//         </Tooltip>
//       </Toolbar>

//       <Divider />

//       <List sx={{ flex: 1, py: 1 }}>
//         {navItems.map((item) => {
//           const selected = location.pathname.startsWith(item.path);
//           const button = (
//             <ListItemButton
//               key={item.path}
//               onClick={() => navigate(item.path)}
//               selected={selected}
//               sx={{
//                 minHeight: 44,
//                 justifyContent: isOpen ? 'initial' : 'center',
//                 px: 1.5,
//               }}
//             >
//               <ListItemIcon
//                 sx={{
//                   minWidth: 0,
//                   mr: isOpen ? 1.5 : 'auto',
//                   justifyContent: 'center',
//                   color: selected ? 'secondary.main' : 'inherit',
//                 }}
//               >
//                 {item.icon}
//               </ListItemIcon>
//               {isOpen && (
//                 <ListItemText
//                   primary={item.label}
//                   primaryTypographyProps={{
//                     fontWeight: selected ? 700 : 500,
//                   }}
//                 />
//               )}
//             </ListItemButton>
//           );

//           return isOpen ? (
//             <React.Fragment key={item.path}>{button}</React.Fragment>
//           ) : (
//             <Tooltip key={item.path} title={item.label} placement="right">
//               <Box>{button}</Box>
//             </Tooltip>
//           );
//         })}

//         <Divider sx={{ my: 1 }} />

//         <Box sx={{ mt: 'auto' }}>
//           {isOpen ? (
//             <ListItemButton onClick={onLogout}>
//               <ListItemIcon sx={{ minWidth: 0, mr: 1.5, justifyContent: 'center' }}>
//                 <LogoutIcon color="error" />
//               </ListItemIcon>
//               <ListItemText primary="Logout" />
//             </ListItemButton>
//           ) : (
//             <Tooltip title="Logout" placement="right">
//               <ListItemButton onClick={onLogout} sx={{ justifyContent: 'center' }}>
//                 <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
//                   <LogoutIcon color="error" />
//                 </ListItemIcon>
//               </ListItemButton>
//             </Tooltip>
//           )}
//         </Box>
//       </List>
//     </Box>
//   );

//   return (
//     <ThemeProvider theme={theme}>
//       <Box sx={{ display: 'flex' }}>
//         <CssBaseline />
//         <AppBar
//           position="fixed"
//           color="primary"
//           elevation={1}
//           sx={{
//             width: { sm: `calc(100% - ${computedDrawerWidth}px)` },
//             ml: { sm: `${computedDrawerWidth}px` },
//             transition: (t) =>
//               t.transitions.create(['width', 'margin'], {
//                 duration: t.transitions.duration.shorter,
//               }),
//           }}
//         >
//           <Toolbar sx={{ gap: 1 }}>
//             <IconButton
//               color="inherit"
//               edge="start"
//               onClick={handleDrawerToggle}
//               sx={{ mr: 1, display: { sm: 'none' } }}
//               aria-label="open drawer"
//             >
//               <MenuIcon />
//             </IconButton>

//             <Typography variant="h6" noWrap component="div" color="inherit" sx={{ mr: 1 }}>
//               ERPEaz Dashboard
//             </Typography>

//             <Box
//               sx={{
//                 position: 'relative',
//                 borderRadius: 10,
//                 backgroundColor: (t) => alpha(t.palette.common.black, 0.06),
//                 '&:hover': {
//                   backgroundColor: (t) => alpha(t.palette.common.black, 0.1),
//                 },
//                 ml: 1,
//                 display: { xs: 'none', sm: 'flex' },
//                 alignItems: 'center',
//                 px: 1.5,
//                 py: 0.5,
//                 minWidth: 260,
//                 flex: 1,
//                 maxWidth: 520,
//               }}
//             >
//               <SearchIcon fontSize="small" />
//               <InputBase
//                 placeholder="Search…"
//                 inputProps={{ 'aria-label': 'search' }}
//                 sx={{ ml: 1, width: '100%' }}
//               />
//             </Box>

//             <Box sx={{ flexGrow: 1 }} />

//             <Tooltip title="Toggle light/dark">
//               <IconButton color="inherit" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
//                 {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
//               </IconButton>
//             </Tooltip>

//             <Tooltip title="Notifications">
//               <IconButton color="inherit">
//                 <Badge badgeContent={notifCount} color="secondary" max={99}>
//                   <NotificationsIcon />
//                 </Badge>
//               </IconButton>
//             </Tooltip>

//             <Tooltip title="Account">
//               <IconButton color="inherit" onClick={handleOpenProfile} sx={{ p: 0 }}>
//                 <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>A</Avatar>
//               </IconButton>
//             </Tooltip>

//             <Menu
//               anchorEl={profileEl}
//               open={Boolean(profileEl)}
//               onClose={handleCloseProfile}
//               anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//               transformOrigin={{ vertical: 'top', horizontal: 'right' }}
//             >
//               <MenuItem onClick={handleCloseProfile}>Profile</MenuItem>
//               <MenuItem onClick={handleCloseProfile}>Settings</MenuItem>
//               <MenuItem onClick={onLogout}>Logout</MenuItem>
//             </Menu>
//           </Toolbar>
//         </AppBar>

//         <Box
//           component="nav"
//           sx={{ width: { sm: computedDrawerWidth }, flexShrink: { sm: 0 } }}
//           aria-label="main navigation"
//         >
//           <Drawer
//             variant="temporary"
//             open={mobileOpen}
//             onClose={handleDrawerToggle}
//             ModalProps={{ keepMounted: true }}
//             sx={{
//               display: { xs: 'block', sm: 'none' },
//               '& .MuiDrawer-paper': { width: drawerWidth },
//             }}
//           >
//             {drawer}
//           </Drawer>

//           <Drawer
//             variant="permanent"
//             open
//             PaperProps={{
//               onMouseEnter: () => setHovered(true),
//               onMouseLeave: () => setHovered(false),
//             }}
//             sx={{
//               display: { xs: 'none', sm: 'block' },
//               '& .MuiDrawer-paper': {
//                 width: computedDrawerWidth,
//                 transition: 'width 0.2s ease',
//                 overflowX: 'hidden',
//               },
//             }}
//           >
//             {drawer}
//           </Drawer>
//         </Box>

//         <Box
//           component="main"
//           sx={{
//             flexGrow: 1,
//             p: 3,
//             width: { sm: `calc(100% - ${computedDrawerWidth}px)` },
//             mt: 8,
//             transition: (t) =>
//               t.transitions.create('width', { duration: t.transitions.duration.shorter }),
//           }}
//         >
//           {children}
//         </Box>
//       </Box>
//     </ThemeProvider>
//   );
// }
