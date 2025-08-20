import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Hello from "./Hello";
import MessageList from "../Messages/MessageList";
import { returnfirstNote } from "../Note/NoteHome";
import { Note, SortCriteria } from "../Note/types";
import Account from "../Account/Account";
import NotificationButton from "../components/NotificationButton/NotificationButton";
import TimeMachineComponent from "../TimeMachine/TimeMachine";
import "./HomePage.css";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Card,
  CardContent,
  Grid,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Fab,
  Paper,
  Button,
  Badge
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Assessment as StatsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  StickyNote2 as NoteIcon,
  Timer as PomodoroIcon,
  Work as ProjectIcon,
  School as StudyIcon,
  Notifications as NotificationsIcon,
  AccessTime as TimeMachineIcon
} from "@mui/icons-material";

interface Invitation {
  _id: string;
  senderId: {
    username: string;
    email: string;
  };
  studySettings: any;
  message: string;
  status: string;
  createdAt: string;
}

interface HomePageProps {
  notifications?: Invitation[];
  onAcceptInvitation?: (invitationId: string) => void;
  onDeclineInvitation?: (invitationId: string) => void;
}

function HomePage({
  notifications = [],
  onAcceptInvitation = () => {},
  onDeclineInvitation = () => {}
}: HomePageProps) {
  const navigate = useNavigate();
  const [firstNote, setFirstNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("date");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    const fetchFirstNote = async () => {
      const note = await returnfirstNote(sortCriteria);
      setFirstNote(note);
      setLoading(false);
    };

    fetchFirstNote();

    // Get current user info
    const username = localStorage.getItem("username");
    if (username) {
      setCurrentUser(username);
    }
  }, [sortCriteria]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const menuItems = [
    {
      category: "📊 Dashboard",
      items: [
        { name: "Home", icon: <DashboardIcon />, path: "/Homepage" },
        { name: "Master Calendar", icon: <CalendarIcon />, path: "/master-calendar" },
        { name: "Calendario Dashboard", icon: <ScheduleIcon />, path: "/calendario-dashboard" },
        { name: "Statistiche", icon: <StatsIcon />, path: "/statistics" }
      ]
    },
    {
      category: "🛠️ Strumenti",
      items: [
        { name: "Note", icon: <NoteIcon />, path: "/Note" },
        { name: "Pomodoro Timer", icon: <PomodoroIcon />, path: "/Pomodoro" },
        { name: "Progetti", icon: <ProjectIcon />, path: "/progetti" },
        { name: "Study Cycles", icon: <StudyIcon />, path: "/studycycle" }
      ]
    },
    {
      category: "⚙️ Impostazioni",
      items: [
        { name: "Profilo Utente", icon: <PersonIcon />, path: "/profile" },
        { name: "Impostazioni App", icon: <SettingsIcon />, path: "/settings" }
      ]
    }
  ];

  const renderDrawer = () => (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={handleDrawerToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          🗓️ TecnoWeb Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Benvenuto, {currentUser || 'Utente'}
        </Typography>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      
      {menuItems.map((section, sectionIndex) => (
        <Box key={sectionIndex}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              px: 2, 
              py: 1, 
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            {section.category}
          </Typography>
          <List dense>
            {section.items.map((item, itemIndex) => (
              <ListItem
                key={itemIndex}
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                sx={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  mx: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>
          {sectionIndex < menuItems.length - 1 && (
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2, my: 1 }} />
          )}
        </Box>
      ))}
    </Drawer>
  );

  const quickStats = [
    { 
      title: "Note Attive", 
      value: firstNote ? "1+" : "0", 
      icon: <NoteIcon sx={{ color: '#9c27b0' }} />,
      action: () => navigate("/Note")
    },
    { 
      title: "Progetti", 
      value: "2", 
      icon: <ProjectIcon sx={{ color: '#2196f3' }} />,
      action: () => navigate("/progetti")
    },
    { 
      title: "Study Cycles", 
      value: "3", 
      icon: <StudyIcon sx={{ color: '#ff9800' }} />,
      action: () => navigate("/studycycle")
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}
      >
        <Toolbar>
          {/* Menu Button */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Title */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🗓️ TecnoWeb - Workspace Unificato
          </Typography>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={handleUserMenuOpen}
            sx={{ mr: 1 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
              {currentUser.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>

          {/* Notifications */}
          <Badge badgeContent={notifications.length} color="error">
            <NotificationButton
              notifications={notifications}
              onAccept={onAcceptInvitation}
              onDecline={onDeclineInvitation}
            />
          </Badge>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => { navigate("/profile"); handleUserMenuClose(); }}>
          <PersonIcon sx={{ mr: 1 }} /> Profilo
        </MenuItem>
        <MenuItem onClick={() => { navigate("/settings"); handleUserMenuClose(); }}>
          <SettingsIcon sx={{ mr: 1 }} /> Impostazioni
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Menu>

      {/* Drawer Menu */}
      {renderDrawer()}

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {quickStats.map((stat, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={stat.action}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    {stat.icon}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Section - Sezione Principale */}
        <Paper 
          elevation={3}
          sx={{ 
            mb: 4,
            borderRadius: 3,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            minHeight: 400,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.01)',
              boxShadow: '0 25px 80px rgba(102, 126, 234, 0.3)'
            }
          }}
          onClick={() => navigate("/master-calendar")}
        >
          {/* Background Pattern */}
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 60%, rgba(255,255,255,0.05) 0%, transparent 50%)
              `,
              zIndex: 1
            }} 
          />
          
          <Box sx={{ p: 4, position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Header */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CalendarIcon sx={{ fontSize: 48, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    📅 Calendario Master
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Il cuore del tuo workspace
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                Gestisci tutti i tuoi eventi, progetti, study cycles e note in un'unica vista unificata. 
                Sincronizzazione automatica, filtri avanzati e statistiche complete.
              </Typography>
              
              {/* Features Grid */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ScheduleIcon sx={{ mr: 2, opacity: 0.8 }} />
                    <Typography variant="body2">Eventi & Ricorrenze</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ProjectIcon sx={{ mr: 2, opacity: 0.8 }} />
                    <Typography variant="body2">Progetti & Milestone</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <StudyIcon sx={{ mr: 2, opacity: 0.8 }} />
                    <Typography variant="body2">Study Cycles</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <NoteIcon sx={{ mr: 2, opacity: 0.8 }} />
                    <Typography variant="body2">Note & To-Do</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CalendarIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/master-calendar");
                }}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  }
                }}
              >
                Apri Calendario Master
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<StatsIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/calendario-dashboard");
                }}
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(5px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.8)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Dashboard
              </Button>
            </Box>
          </Box>
          
          {/* Decorative Elements */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -50, 
              right: -50, 
              width: 200, 
              height: 200, 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)',
              zIndex: 1
            }} 
          />
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: -30, 
              left: -30, 
              width: 150, 
              height: 150, 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)',
              zIndex: 1
            }} 
          />
        </Paper>

        {/* Three Main Sections */}
        <Grid container spacing={4}>
          {/* Pomodoro Section */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: 300,
                background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 15px 40px rgba(255, 152, 0, 0.3)'
                }
              }}
              onClick={() => navigate("/Pomodoro")}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PomodoroIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      🍅 Pomodoro Timer
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Migliora la tua produttività con la tecnica Pomodoro. 
                    Sessioni di studio focalizzate con pause programmate.
                  </Typography>
                </Box>
                
                <Box>
                  <Button
                    variant="outlined"
                    sx={{ 
                      color: 'white', 
                      borderColor: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: 'white'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/Pomodoro");
                    }}
                  >
                    Avvia Timer
                  </Button>
                </Box>
              </CardContent>
              
              {/* Decorative element */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.1)' 
                }} 
              />
            </Card>
          </Grid>

          {/* Note Section */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: 300,
                background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 15px 40px rgba(156, 39, 176, 0.3)'
                }
              }}
              onClick={() => navigate("/Note")}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <NoteIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      📝 Note Intelligenti
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Gestisci le tue note con to-do lists integrate. 
                    Sincronizzazione automatica con il calendario.
                  </Typography>
                  
                  {firstNote && (
                    <Box sx={{ backgroundColor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Ultima nota:
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {firstNote.title.substring(0, 50)}...
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box>
                  <Button
                    variant="outlined"
                    sx={{ 
                      color: 'white', 
                      borderColor: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: 'white'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/Note");
                    }}
                  >
                    Gestisci Note
                  </Button>
                </Box>
              </CardContent>
              
              {/* Decorative element */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.1)' 
                }} 
              />
            </Card>
          </Grid>

          {/* Projects Section */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: 300,
                background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 15px 40px rgba(33, 150, 243, 0.3)'
                }
              }}
              onClick={() => navigate("/progetti")}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ProjectIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      🚀 Project Management
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Organizza i tuoi progetti con task, milestone e Gantt chart. 
                    Integrazione completa con il calendario.
                  </Typography>
                </Box>
                
                <Box>
                  <Button
                    variant="outlined"
                    sx={{ 
                      color: 'white', 
                      borderColor: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderColor: 'white'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/progetti");
                    }}
                  >
                    Gestisci Progetti
                  </Button>
                </Box>
              </CardContent>
              
              {/* Decorative element */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: -20, 
                  right: -20, 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.1)' 
                }} 
              />
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* TimeMachine Button (Floating) */}
      <TimeMachineComponent />
    </Box>
  );
}

export default HomePage;
