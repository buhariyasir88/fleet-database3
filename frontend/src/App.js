import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import Vessels from './components/Vessels';
import Clients from './components/Clients';
import Contracts from './components/Contracts';
import Tenders from './components/Tenders';
import Invoices from './components/Invoices';
import Utilization from './components/Utilization';
import Reports from './components/Reports';

// MUI components
import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Box,
  Container,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  TextField,
  Button,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsBoat as VesselIcon,
  People as ClientsIcon,
  Description as ContractsIcon,
  RequestQuote as TendersIcon,
  Receipt as InvoiceIcon,
  Speed as UtilizationIcon,
  Assessment as ReportsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

const drawerWidth = 260;

// DJ Group Color Scheme
const colors = {
  primary: '#0a1628',
  primaryLight: '#1a2a4a',
  gold: '#c9a84c',
  goldLight: '#e8d5a3',
  white: '#ffffff',
  textLight: 'rgba(255,255,255,0.7)',
  textWhite: '#ffffff',
};

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Vessels', icon: <VesselIcon />, path: '/vessels' },
  { text: 'Clients', icon: <ClientsIcon />, path: '/clients' },
  { text: 'Contracts', icon: <ContractsIcon />, path: '/contracts' },
  { text: 'Tenders', icon: <TendersIcon />, path: '/tenders' },
  { text: 'Invoices', icon: <InvoiceIcon />, path: '/invoices' },
  { text: 'Utilization', icon: <UtilizationIcon />, path: '/utilization' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
];

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleLogin = (username, password) => {
    if ((username === 'admin' && password === 'admin123') || 
        (username === 'chartering' && password === 'chartering123')) {
      setIsAuthenticated(true);
      setUser(username);
      setSnackbar({ open: true, message: `Welcome ${username}!`, severity: 'success' });
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setAnchorEl(null);
    setSnackbar({ open: true, message: 'Logged out successfully', severity: 'info' });
  };

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: colors.primary }}>
      <Toolbar sx={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
        borderBottom: `1px solid rgba(201, 168, 76, 0.2)`,
        py: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/images/DJ Group Logo.png"
            alt="DJ Group Logo"
            sx={{
              width: 42,
              height: 42,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ 
              color: colors.white, 
              fontWeight: 700, 
              lineHeight: 1.1,
              fontSize: '1rem',
              letterSpacing: '0.02em',
            }}>
              DJ Group
            </Typography>
            <Typography variant="caption" sx={{ 
              color: colors.gold,
              fontWeight: 500,
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Chartering Database
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      
      <Divider sx={{ borderColor: 'rgba(201, 168, 76, 0.1)' }} />
      
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: `rgba(201, 168, 76, 0.15)`,
                '& .MuiListItemIcon-root': {
                  color: colors.gold,
                },
                '& .MuiListItemText-primary': {
                  color: colors.white,
                  fontWeight: 600,
                },
              },
              '&:hover': {
                backgroundColor: `rgba(201, 168, 76, 0.08)`,
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path ? colors.gold : colors.textLight,
              minWidth: 40,
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{
                '& .MuiListItemText-primary': {
                  color: location.pathname === item.path ? colors.white : colors.textLight,
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }
              }}
            />
            {location.pathname === item.path && (
              <Box sx={{ 
                width: 4, 
                height: 28, 
                bgcolor: colors.gold, 
                borderRadius: 2 
              }} />
            )}
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        p: 2,
        borderTop: `1px solid rgba(201, 168, 76, 0.1)`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: colors.gold,
            color: colors.primary,
            fontSize: '0.8rem',
            fontWeight: 700,
          }}>
            {user?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="caption" sx={{ color: colors.textLight }}>
              Logged in as
            </Typography>
            <Typography variant="body2" sx={{ color: colors.white, fontWeight: 500 }}>
              {user || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: colors.white,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderBottom: `1px solid rgba(201, 168, 76, 0.15)`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' }, color: colors.primary }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ 
              color: colors.primary, 
              fontWeight: 600,
              fontSize: '1.1rem',
            }}>
              {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 6, 
              height: 6, 
              bgcolor: colors.gold, 
              borderRadius: '50%',
              display: { xs: 'none', sm: 'block' },
            }} />
            
            {/* ===== LOGOUT BUTTON - FIXED ===== */}
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: '#64748b',
                px: 2,
                py: 0.8,
                '&:hover': {
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  backgroundColor: 'rgba(239,68,68,0.04)',
                }
              }}
            >
              Logout
            </Button>
            
            <Tooltip title="Account">
              <IconButton onClick={handleMenu} size="small">
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: colors.gold,
                  color: colors.primary,
                  fontWeight: 600,
                }}>
                  {user?.charAt(0).toUpperCase() || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  minWidth: 180,
                }
              }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user}</Typography>
                  <Typography variant="caption" color="textSecondary">Administrator</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, 
              bgcolor: colors.primary,
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, 
              bgcolor: colors.primary,
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f8f6f1',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vessels" element={<Vessels />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/tenders" element={<Tenders />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/utilization" element={<Utilization />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ===== LOGIN COMPONENT WITH HIDDEN PASSWORD =====
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const colors = {
    primary: '#0a1628',
    gold: '#c9a84c',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(username, password)) {
      setError('');
      setUsername('');
      setPassword('');
    } else {
      setError('Invalid username or password');
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${colors.primary} 0%, #1a2a4a 50%, ${colors.primary} 100%)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)`,
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -150,
        left: -150,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)`,
      }} />
      
      <Box sx={{ 
        width: 420, 
        padding: 5, 
        backgroundColor: 'white', 
        borderRadius: 4, 
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <Box sx={{ mb: 3 }}>
          <Box
            component="img"
            src="/images/DJ Group Logo.png"
            alt="DJ Group Logo"
            sx={{
              width: 64,
              height: 64,
              objectFit: 'contain',
              mx: 'auto',
              mb: 1,
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            color: colors.primary,
            letterSpacing: '0.02em',
          }}>
            DJ Group
          </Typography>
          <Typography variant="body2" sx={{ 
            color: colors.gold,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
          }}>
            Chartering Database
          </Typography>
          <Divider sx={{ my: 2, borderColor: 'rgba(201,168,76,0.3)' }} />
          <Typography variant="body2" color="textSecondary">
            Fleet Management System
          </Typography>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            sx={{ 
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.gold,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: colors.gold,
              },
            }}
          />
          
          {/* ===== PASSWORD FIELD WITH HIDE/SHOW ===== */}
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePassword}
                    edge="end"
                    sx={{ color: '#64748b' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.gold,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: colors.gold,
              },
            }}
          />
          
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              bgcolor: colors.gold,
              color: colors.primary,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              '&:hover': {
                bgcolor: '#b8943a',
              },
            }}
          >
            Sign In
          </Button>
          
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            Demo: admin / admin123
          </Typography>
        </form>
      </Box>
    </Box>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;