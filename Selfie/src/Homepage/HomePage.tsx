import React, { useEffect, useState, useRef } from "react";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Hello from "./Hello";
import MessageList from "../Messages/MessageList";
import { returnfirstNote } from "../Note/NoteHome";
import { Note, SortCriteria } from "../Note/types";
import ProfileModal from "../Account/ProfileModal";
import NotificationButton from "../components/NotificationButton/NotificationButton";
import TimeMachineComponent from "../TimeMachine/TimeMachine";
import { StudyCycleService } from "../StudyCycle/StudyCycleService";
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
  Badge,
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
  AccessTime as TimeMachineIcon,
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
  onDeclineInvitation = () => {},
}: HomePageProps) {
  const navigate = useNavigate();
  const [firstNote, setFirstNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>("date");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [currentUser, setCurrentUser] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Stati per le preview delle sezioni
  const [lastEvent, setLastEvent] = useState<any | null>(null);
  const [lastStudyCycle, setLastStudyCycle] = useState<any | null>(null);
  const [lastProject, setLastProject] = useState<any | null>(null);

  // Funzione per ottenere gli headers di autenticazione
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Funzione per recuperare l'ultimo evento del calendario
  const fetchLastEvent = async () => {
    try {
      const response = await fetch("/api/events?limit=1&sort=start:desc", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const events = await response.json();
        if (events && events.length > 0) {
          setLastEvent({
            ...events[0],
            start: new Date(events[0].start),
            end: new Date(events[0].end),
          });
        }
      }
    } catch (error) {
      console.error("Errore nel recupero dell'ultimo evento:", error);
    }
  };

  // Funzione per recuperare l'ultima sessione Pomodoro
  const fetchLastStudyCycle = async () => {
    try {
      const studyCycles = await StudyCycleService.getStudyCycles();
      if (studyCycles && studyCycles.length > 0) {
        // Ordina per data più recente
        studyCycles.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setLastStudyCycle(studyCycles[0]);
      }
    } catch (error) {
      console.error("Errore nel recupero dell'ultimo study cycle:", error);
    }
  };

  // Funzione per recuperare l'ultimo progetto
  const fetchLastProject = async () => {
    try {
      const response = await fetch("/api/getprojects", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const projects = await response.json();
        if (projects && projects.length > 0) {
          // Ordina per data di aggiornamento più recente
          projects.sort(
            (a, b) =>
              new Date(b.updatedAt || b.createdAt).getTime() -
              new Date(a.updatedAt || a.createdAt).getTime()
          );
          setLastProject(projects[0]);
        }
      }
    } catch (error) {
      console.error("Errore nel recupero dell'ultimo progetto:", error);
    }
  };

  useEffect(() => {
    const fetchFirstNote = async () => {
      const note = await returnfirstNote(sortCriteria);
      setFirstNote(note);
      setLoading(false);
    };

    fetchFirstNote();
    fetchLastEvent();
    fetchLastStudyCycle();
    fetchLastProject();

    // Get current user info and profile image from JWT
    const token = localStorage.getItem("token");
    try {
      if (token) {
        interface DecodedToken extends JwtPayload {
          username?: string;
          userId?: string;
        }
        const decoded = jwtDecode<DecodedToken>(token);
        const usernameFromToken =
          decoded.username || localStorage.getItem("username") || "";
        setCurrentUser(usernameFromToken);

        const storedUserId =
          localStorage.getItem("userId") || decoded.userId || "";
        if (storedUserId) {
          fetch(`/api/user/${storedUserId}/image`)
            .then((res) => {
              if (!res.ok) throw new Error("No profile image");
              return res.blob();
            })
            .then((blob) => setProfileImage(URL.createObjectURL(blob)))
            .catch(() => {});
        }
      }
    } catch (e) {
      // Fallback: keep existing currentUser from localStorage if set
      const username = localStorage.getItem("username");
      if (username) setCurrentUser(username);
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
        {
          name: "Master Calendar",
          icon: <CalendarIcon />,
          path: "/master-calendar",
        },
        {
          name: "Calendario Dashboard",
          icon: <ScheduleIcon />,
          path: "/calendario-dashboard",
        },
        { name: "Statistiche", icon: <StatsIcon />, path: "/statistics" },
      ],
    },
    {
      category: "🛠️ Strumenti",
      items: [
        { name: "Note", icon: <NoteIcon />, path: "/Note" },
        { name: "Pomodoro Timer", icon: <PomodoroIcon />, path: "/Pomodoro" },
        { name: "Progetti", icon: <ProjectIcon />, path: "/progetti" },
        { name: "Study Cycles", icon: <StudyIcon />, path: "/studycycle" },
      ],
    },
    {
      category: "⚙️ Impostazioni",
      items: [
        { name: "Profilo Utente", icon: <PersonIcon />, path: "/profile" },
        { name: "Impostazioni App", icon: <SettingsIcon />, path: "/settings" },
      ],
    },
  ];

  const renderDrawer = () => (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={handleDrawerToggle}
      PaperProps={{ className: "drawer-menu", sx: { width: 280 } }}
    >
      <Box className="drawer-header" sx={{ p: 2 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: "var(--dark-color)", fontWeight: "bold" }}
        >
          🗓️ TecnoWeb Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
          Benvenuto, {currentUser ? currentUser : "Utente"}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      {menuItems.map((section, sectionIndex) => (
        <Box key={sectionIndex}>
          <Typography
            variant="subtitle2"
            className="drawer-section-title"
            sx={{ px: 2, py: 1 }}
          >
            {section.category}
          </Typography>
          <List dense>
            {section.items.map((item, itemIndex) => (
              <ListItem
                key={itemIndex}
                onClick={() => {
                  if (item.path === "/profile") {
                    setIsProfileModalOpen(true);
                    setDrawerOpen(false);
                    return;
                  }
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                className="drawer-menu-item"
                sx={{ cursor: "pointer", borderRadius: "8px", mx: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ color: "var(--text-color)", minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                />
              </ListItem>
            ))}
          </List>
          {sectionIndex < menuItems.length - 1 && (
            <Divider
              sx={{ borderColor: "var(--border-color)", mx: 2, my: 1 }}
            />
          )}
        </Box>
      ))}
    </Drawer>
  );

  const quickStats = [
    {
      title: "Note Attive",
      value: firstNote ? "1+" : "0",
      icon: <NoteIcon sx={{ color: "#9c27b0" }} />,
      action: () => navigate("/Note"),
    },
    {
      title: "Progetti",
      value: "2",
      icon: <ProjectIcon sx={{ color: "#2196f3" }} />,
      action: () => navigate("/progetti"),
    },
    {
      title: "Study Cycles",
      value: "3",
      icon: <StudyIcon sx={{ color: "#ff9800" }} />,
      action: () => navigate("/studycycle"),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "var(--background-color)",
        color: "var(--text-color)",
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
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
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            Selfie - Workspace
          </Typography>

          {/* Notifications */}
          <Badge
            badgeContent={notifications.length}
            color="error"
            sx={{ mr: 1 }}
          >
            <NotificationButton
              notifications={notifications}
              onAccept={onAcceptInvitation}
              onDecline={onDeclineInvitation}
              inline
            />
          </Badge>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={handleUserMenuOpen}
            sx={{ mr: 1 }}
          >
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,0.2)" }}
              src={profileImage || undefined}
            >
              {currentUser.charAt(0).toUpperCase() || "U"}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem
          onClick={() => {
            setIsProfileModalOpen(true);
            handleUserMenuClose();
          }}
        >
          <PersonIcon sx={{ mr: 1 }} /> Profilo
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/settings");
            handleUserMenuClose();
          }}
        >
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
                  background: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
                  },
                }}
                onClick={stat.action}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold", mb: 0.5 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 2 }}>{stat.icon}</Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Main Sections - 2x2 Grid */}
        <Grid container spacing={4}>
          {/* Calendar Section */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: 350,
                color: "white",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                width: "100%",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 20px rgba(59, 130, 246, 0.4)",
                },
              }}
              onClick={() => navigate("/master-calendar")}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  p: 3,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <CalendarIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      Calendario
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Gestisci tutti i tuoi eventi, progetti e study cycles. Vista
                    unificata e sincronizzazione automatica.
                  </Typography>

                  {lastEvent && (
                    <Box
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        p: 2,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Prossimo evento:
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {lastEvent.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.7, fontSize: "0.8rem", mt: 1 }}
                      >
                        {lastEvent.start.toLocaleDateString()}{" "}
                        {lastEvent.start.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Button
                    variant="contained"
                    color="inherit"
                    className="calendar-section-button"
                    sx={{
                      backgroundColor: "#374151 !important",
                      color: "white !important",
                      border: "1px solid rgba(255,255,255,0.8) !important",
                      "&:hover": {
                        backgroundColor: "#4b5563 !important",
                        transform: "translateY(-2px)",
                        boxShadow: "none !important",
                      },
                      "&.MuiButton-root": {
                        backgroundColor: "#374151 !important",
                      },
                      "&.MuiButton-contained": {
                        backgroundColor: "#374151 !important",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/master-calendar");
                    }}
                  >
                    Apri Calendario
                  </Button>
                </Box>
              </CardContent>

              {/* Decorative element */}
              <Box
                sx={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            </Card>
          </Grid>

          {/* Pomodoro Section */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: 350,
                color: "white",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                width: "100%",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 20px rgba(245, 158, 11, 0.4)",
                },
              }}
              onClick={() => navigate("/Pomodoro")}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  p: 3,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <PomodoroIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      Pomodoro Timer
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Migliora la tua produttività con la tecnica Pomodoro.
                    Sessioni di studio focalizzate con pause programmate.
                  </Typography>

                  {lastStudyCycle && (
                    <Box
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        p: 2,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Ultima sessione:
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {lastStudyCycle.title || "Studio"} -{" "}
                        {lastStudyCycle.subject || "Generale"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.7, fontSize: "0.8rem", mt: 1 }}
                      >
                        {new Date(lastStudyCycle.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Button
                    variant="contained"
                    color="inherit"
                    className="pomodoro-section-button"
                    sx={{
                      backgroundColor: "#374151 !important",
                      color: "white !important",
                      border: "1px solid rgba(255,255,255,0.8) !important",
                      "&:hover": {
                        backgroundColor: "#4b5563 !important",
                        transform: "translateY(-2px)",
                        boxShadow: "none !important",
                      },
                      "&.MuiButton-root": {
                        backgroundColor: "#374151 !important",
                      },
                      "&.MuiButton-contained": {
                        backgroundColor: "#374151 !important",
                      },
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
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            </Card>
          </Grid>

          {/* Note Section */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: 350,
                color: "white",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                width: "100%",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 20px rgba(6, 182, 212, 0.4)",
                },
              }}
              onClick={() => navigate("/Note")}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  p: 3,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <NoteIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      Note
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Gestisci le tue note con to-do lists integrate.
                    Sincronizzazione automatica con il calendario.
                  </Typography>

                  {firstNote && (
                    <Box
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        p: 2,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Ultima nota:
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {firstNote.title.substring(0, 50)}...
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.7, fontSize: "0.8rem", mt: 1 }}
                      >
                        {new Date(
                          firstNote.updatedAt || firstNote.createdAt
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Button
                    variant="contained"
                    color="inherit"
                    className="notes-section-button"
                    sx={{
                      backgroundColor: "#1f2937 !important",
                      color: "white !important",
                      border: "1px solid rgba(255,255,255,0.8) !important",
                      "&:hover": {
                        backgroundColor: "#374151 !important",
                        transform: "translateY(-2px)",
                        boxShadow: "none !important",
                      },
                      "&.MuiButton-root": {
                        backgroundColor: "#1f2937 !important",
                      },
                      "&.MuiButton-contained": {
                        backgroundColor: "#1f2937 !important",
                      },
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
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            </Card>
          </Grid>

          {/* Projects Section */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: 350,
                color: "white",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                width: "100%",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 20px rgba(34, 197, 94, 0.4)",
                },
              }}
              onClick={() => navigate("/progetti")}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  p: 3,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <ProjectIcon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      Project Management
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Organizza i tuoi progetti con task, milestone e Gantt chart.
                    Integrazione completa con il calendario.
                  </Typography>

                  {lastProject && (
                    <Box
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        p: 2,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Ultimo progetto:
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {lastProject.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.7, fontSize: "0.8rem", mt: 1 }}
                      >
                        {lastProject.description &&
                          lastProject.description.substring(0, 100)}
                        {lastProject.description &&
                        lastProject.description.length > 100
                          ? "..."
                          : ""}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Button
                    variant="contained"
                    color="inherit"
                    className="projects-section-button"
                    sx={{
                      backgroundColor: "#111827 !important",
                      color: "white !important",
                      border: "1px solid rgba(255,255,255,0.8) !important",
                      "&:hover": {
                        backgroundColor: "#1f2937 !important",
                        transform: "translateY(-2px)",
                        boxShadow: "none !important",
                      },
                      "&.MuiButton-root": {
                        backgroundColor: "#111827 !important",
                      },
                      "&.MuiButton-contained": {
                        backgroundColor: "#111827 !important",
                      },
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
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            </Card>
          </Grid>
        </Grid>
      </Container>
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </Box>
  );
}

export default HomePage;
