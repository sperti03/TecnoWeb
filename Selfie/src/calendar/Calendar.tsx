import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Button from "@mui/material/Button";
import logo from "./images/logo.png";
import { createEvents, EventAttributes } from "ics";
import { StudyCycleService } from "../StudyCycle/StudyCycleService";
import { useNavigate } from "react-router-dom";
import StudyCycleModal from "./StudyCycleModal";

const localizer = momentLocalizer(moment);

interface Event {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  userId: string;
  notificationLeadTime: number;
  repeatInterval: number;
  eventType?: string;
  studyCycleId?: string;
}

const CalendarHome: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStudyCycleModal, setShowStudyCycleModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/events", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        setEvents(
          data.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          }))
        );
      } catch (err) {
        setError("Error fetching events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Auto-reschedule incomplete cycles on component load
    const autoReschedule = async () => {
      try {
        await StudyCycleService.rescheduleIncomplete();
      } catch (error) {
        console.log("Auto-reschedule check completed");
      }
    };
    autoReschedule();

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check for upcoming events
    const intervalId = setInterval(checkUpcomingEvents, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const checkUpcomingEvents = () => {
    const now = new Date();
    events.forEach((event) => {
      const diffInMinutes = (event.start.getTime() - now.getTime()) / 60000;
      if (diffInMinutes <= event.notificationLeadTime && diffInMinutes > 0) {
        sendNotification(event);
      }
    });
  };

  const sendNotification = (event: Event) => {
    if (Notification.permission === "granted") {
      const notifyInterval = setInterval(() => {
        new Notification(`Upcoming Event: ${event.title}`, {
          body: `Starting in ${event.notificationLeadTime} minutes`,
          icon: logo,
        });
      }, event.repeatInterval * 60000);

      setTimeout(
        () => clearInterval(notifyInterval),
        event.notificationLeadTime * 60000
      );
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const choice = window.prompt(
      "What would you like to create?\n1. Regular Event\n2. Study Cycle\nEnter 1 or 2:"
    );

    if (choice === "1") {
      createRegularEvent(start, end);
    } else if (choice === "2") {
      setSelectedSlot({ start, end });
      setShowStudyCycleModal(true);
    }
  };

  const createRegularEvent = (start: Date, end: Date) => {
    const title = window.prompt("New Event name");
    const notificationLeadTime = parseInt(
      window.prompt("Minutes before event to notify?") || "0",
      10
    );
    const repeatInterval = parseInt(
      window.prompt("Notification repeat interval in minutes?") || "0",
      10
    );

    if (title) {
      const newEvent = {
        title,
        start,
        end,
        notificationLeadTime,
        repeatInterval,
        eventType: "general",
      };

      const token = localStorage.getItem("token");
      if (!token) {
        setError("User not authenticated");
        return;
      }

      fetch("http://localhost:3000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to create event");
          }
          return response.json();
        })
        .then((event) => {
          setEvents([
            ...events,
            {
              ...event,
              start: new Date(event.start),
              end: new Date(event.end),
            },
          ]);
        })
        .catch((error) => setError("Error creating event"));
    }
  };

  const handleEventClick = (event: Event) => {
    if (event.eventType === "study-cycle" && event.studyCycleId) {
      // Redirect to Pomodoro with study cycle settings
      navigate(`/Pomodoro?studyCycleId=${event.studyCycleId}`);
    }
  };

  const exportToICalendar = () => {
    const icsEvents: EventAttributes[] = events.map((event) => ({
      title: event.title,
      start: [
        event.start.getFullYear(),
        event.start.getMonth() + 1,
        event.start.getDate(),
        event.start.getHours(),
        event.start.getMinutes(),
      ],
      end: [
        event.end.getFullYear(),
        event.end.getMonth() + 1,
        event.end.getDate(),
        event.end.getHours(),
        event.end.getMinutes(),
      ],
      uid: event.userId,
    }));

    createEvents(icsEvents, (error, value) => {
      if (error) {
        console.error("Error creating iCalendar:", error);
        return;
      }
      const blob = new Blob([value], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "events.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="App">
      <div className="title">
        <img src={logo} alt="Logo" />
      </div>
      <Button variant="contained" color="primary" onClick={exportToICalendar}>
        Export to .ics
      </Button>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleEventClick}
        defaultView="month"
        views={["month", "week", "day"]}
      />

      {showStudyCycleModal && (
        <StudyCycleModal
          isOpen={showStudyCycleModal}
          onClose={() => setShowStudyCycleModal(false)}
          selectedSlot={selectedSlot}
          onStudyCycleCreated={(newEvent) => {
            setEvents([...events, newEvent]);
            setShowStudyCycleModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CalendarHome;
