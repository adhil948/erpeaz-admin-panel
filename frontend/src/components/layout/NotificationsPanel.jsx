// NotificationsPanel.jsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  Alert,
  AlertTitle,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function NotificationsPanel({
  open,
  onClose,
  notifications = [],
  onMarkAllRead,
}) {
  // console.log('Rendering NotificationsPanel with notifications:', notifications);
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Notifications
          </Typography>
          <Tooltip title="Mark all as read">
            <span>
              <IconButton onClick={onMarkAllRead} size="small">✓</IconButton>
            </span>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List disablePadding>
            {notifications.length === 0 ? (
              <ListItem sx={{ px: 2, py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </ListItem>
            ) : (
              notifications.map((n) => (
                <ListItem key={n.id} sx={{ px: 2, py: 1.5 }}>
                  <Alert
                    severity={n.severity}
                    variant={n.read ? 'standard' : 'filled'}
                    sx={{ width: '100%' }}
                  >
                    {n.title && <AlertTitle>{n.title}</AlertTitle>}
                    {n.message}
                    {n.createdAt && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </Typography>
                    )}
                  </Alert>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
}
