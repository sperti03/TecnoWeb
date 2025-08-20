// Service for automatic study cycle management
export const StudyCycleAutoService = {
  // Get incomplete cycles for today
  async getIncompleteCyclesForDate(userId, date) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/study-cycles/incomplete/${userId}/${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching incomplete cycles:', error);
      return [];
    }
  },

  // Move incomplete cycles to next day
  async moveIncompleteCyclesToNextDay(userId, fromDate, toDate) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/study-cycles/move-incomplete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fromDate,
          toDate
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.movedCycles ? result.movedCycles.length : 0;
      }
      return 0;
    } catch (error) {
      console.error('Error moving incomplete cycles:', error);
      return 0;
    }
  },

  // Auto-reschedule incomplete cycles using backend logic
  async autoRescheduleIncomplete() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/study-cycles/reschedule-incomplete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Auto-rescheduled: ${result.message}`);
        return {
          success: true,
          count: result.rescheduledCycles?.length || 0,
          message: result.message,
          cycles: result.rescheduledCycles
        };
      }
      return { success: false, count: 0, message: 'No incomplete cycles found' };
    } catch (error) {
      console.error('Error in auto-reschedule:', error);
      return { success: false, count: 0, message: error.message };
    }
  },

  // Check and move cycles automatically (called daily)
  async autoMoveIncompleteCycles(userId) {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const today = new Date().toISOString().split('T')[0];
      
      const incompleteCycles = await this.getIncompleteCyclesForDate(userId, yesterdayStr);
      
      if (incompleteCycles.length > 0) {
        const movedCount = await this.moveIncompleteCyclesToNextDay(userId, yesterdayStr, today);
        console.log(`Auto-moved ${movedCount} incomplete cycles from yesterday to today`);
        return movedCount;
      }
      
      return 0;
    } catch (error) {
      console.error('Error in auto move incomplete cycles:', error);
      return 0;
    }
  },

  // Initialize daily auto-reschedule (call this once when app starts)
  initializeAutoReschedule() {
    // Check immediately on startup
    this.checkAndReschedule();
    
    // Set up daily check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 00:01 AM
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // First check at midnight
    setTimeout(() => {
      this.checkAndReschedule();
      
      // Then check every 24 hours
      setInterval(() => {
        this.checkAndReschedule();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, msUntilMidnight);
    
    console.log(`🕰️ Auto-reschedule initialized. Next check in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  },

  // Main auto-reschedule function
  async checkAndReschedule() {
    try {
      console.log('🔄 Running daily auto-reschedule check...');
      const result = await this.autoRescheduleIncomplete();
      
      if (result.success && result.count > 0) {
        // Show notification to user
        this.showRescheduleNotification(result.count, result.cycles);
      }
      
      return result;
    } catch (error) {
      console.error('Error in daily auto-reschedule:', error);
      return { success: false, count: 0, message: error.message };
    }
  },

  // Show notification to user about rescheduled cycles
  showRescheduleNotification(count, cycles) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(`📚 Study Cycles Rescheduled`, {
        body: `${count} incomplete study cycle${count > 1 ? 's' : ''} have been automatically moved to today.`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'study-reschedule',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        // Navigate to study cycles page
        if (window.location.pathname !== '/studycycle') {
          window.location.href = '/studycycle';
        }
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }

    // Also show in-app notification if there's a toast system
    if (window.showToast) {
      window.showToast(`🔄 ${count} study cycle${count > 1 ? 's' : ''} rescheduled to today`, 'info');
    }
  },

  // Get today's rescheduled cycles
  async getTodaysRescheduledCycles() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/study-cycles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const cycles = await response.json();
        return cycles.filter(cycle => {
          const cycleDate = new Date(cycle.scheduledDate).toISOString().split('T')[0];
          return cycleDate === today && 
                 (cycle.title.includes('(Rescheduled)') || cycle.title.includes('(Moved)'));
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching today\'s rescheduled cycles:', error);
      return [];
    }
  },

  // Manual reschedule trigger (for UI button)
  async manualReschedule() {
    try {
      const result = await this.autoRescheduleIncomplete();
      
      if (result.success) {
        if (result.count > 0) {
          alert(`✅ Successfully rescheduled ${result.count} incomplete study cycle${result.count > 1 ? 's' : ''} to today!`);
        } else {
          alert('ℹ️ No incomplete study cycles found to reschedule.');
        }
      } else {
        alert(`❌ Error: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error in manual reschedule:', error);
      alert(`❌ Error during reschedule: ${error.message}`);
      return { success: false, count: 0, message: error.message };
    }
  },

  // Check if user has permission for notifications
  async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log(`🔔 Notification permission: ${permission}`);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  },

  // Sync study cycles to calendar
  async syncToCalendar() {
    try {
      const token = localStorage.getItem('token');
      
      // Get all study cycles
      const response = await fetch('/api/study-cycles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch study cycles');
      }

      const studyCycles = await response.json();
      let syncedCount = 0;

      // Create calendar events for each study cycle
      for (const cycle of studyCycles) {
        try {
          // Check if calendar event already exists for this study cycle
          const existingEventResponse = await fetch(`/api/events?studyCycleId=${cycle._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const existingEvents = await existingEventResponse.json();
          
                     // If event doesn't exist, create it
           if (!existingEvents || existingEvents.length === 0) {
             // Validate cycle data before creating dates
             console.log('Processing study cycle:', {
               id: cycle._id,
               title: cycle.title,
               scheduledDate: cycle.scheduledDate,
               scheduledTime: cycle.scheduledTime,
               studyTime: cycle.studyTime,
               pauseTime: cycle.pauseTime,
               targetCycles: cycle.targetCycles
             });

             if (!cycle.scheduledDate) {
               console.warn(`⚠️ Skipping study cycle ${cycle.title}: missing scheduledDate`);
               continue;
             }

             // Validate numeric values
             const studyTime = parseInt(cycle.studyTime) || 25;
             const pauseTime = parseInt(cycle.pauseTime) || 5;
             const targetCycles = parseInt(cycle.targetCycles) || 4;

             if (studyTime <= 0 || pauseTime <= 0 || targetCycles <= 0) {
               console.warn(`⚠️ Skipping study cycle ${cycle.title}: invalid time values`, {
                 studyTime, pauseTime, targetCycles
               });
               continue;
             }

             // Create start and end dates with validation
             let startDate;
             
             // Handle different date formats
             if (cycle.scheduledDate.includes('T')) {
               // scheduledDate is already in ISO format (e.g., "2025-07-20T12:00:00.000Z")
               startDate = new Date(cycle.scheduledDate);
               
               // If scheduledTime is provided, override the time part
               if (cycle.scheduledTime && cycle.scheduledTime !== '09:00') {
                 const [hours, minutes] = cycle.scheduledTime.split(':');
                 startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
               }
             } else {
               // scheduledDate is in YYYY-MM-DD format
               const dateTimeString = `${cycle.scheduledDate}T${cycle.scheduledTime || '09:00'}:00`;
               startDate = new Date(dateTimeString);
             }
             
             console.log('Creating date from:', { 
               scheduledDate: cycle.scheduledDate, 
               scheduledTime: cycle.scheduledTime,
               resultDate: startDate.toISOString()
             });
             
             if (isNaN(startDate.getTime())) {
               console.error(`❌ Invalid date for study cycle ${cycle.title}:`, cycle.scheduledDate);
               continue;
             }

             const totalMinutes = (studyTime + pauseTime) * targetCycles;
             const endDate = new Date(startDate);
             endDate.setMinutes(endDate.getMinutes() + totalMinutes);

             if (isNaN(endDate.getTime())) {
               console.error(`❌ Invalid end date for study cycle ${cycle.title}`);
               continue;
             }

             const eventData = {
               title: `📚 ${cycle.title} - Study Cycle`,
               description: `Materia: ${cycle.subject || 'N/A'}\nTempo studio: ${studyTime} min\nTempo pausa: ${pauseTime} min\nCicli: ${targetCycles}`,
               start: startDate.toISOString(),
               end: endDate.toISOString(),
               eventType: 'study-cycle',
               category: 'study',
               priority: 'high',
               color: '#ff9800',
               studyCycleId: cycle._id,
               studyCycleData: {
                 studyTime: studyTime,
                 pauseTime: pauseTime,
                 cycles: targetCycles,
                 subject: cycle.subject || 'N/A'
               },
               notificationLeadTime: 15 // 15 minuti prima
             };

                         console.log('Creating calendar event for study cycle:', {
               title: eventData.title,
               studyCycleId: cycle._id,
               eventData
             });

             const createResponse = await fetch('/api/events', {
               method: 'POST',
               headers: {
                 'Authorization': `Bearer ${token}`,
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify(eventData),
             });

                         if (createResponse.ok) {
               syncedCount++;
               console.log(`✅ Synced study cycle: ${cycle.title}`);
             } else {
               const errorText = await createResponse.text();
               console.error(`⚠️ Failed to sync study cycle: ${cycle.title}`, {
                 status: createResponse.status,
                 statusText: createResponse.statusText,
                 error: errorText,
                 eventData
               });
             }
          }
        } catch (cycleError) {
          console.error(`Error syncing study cycle ${cycle.title}:`, cycleError);
        }
      }

      console.log(`🔄 Study cycle sync completed: ${syncedCount}/${studyCycles.length} events synced`);
      return { success: true, synced: syncedCount, total: studyCycles.length };

    } catch (error) {
      console.error('Error syncing study cycles to calendar:', error);
      throw error;
    }
  }
};
