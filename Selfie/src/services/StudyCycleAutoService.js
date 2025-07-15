// Service for automatic study cycle management
export const StudyCycleAutoService = {
  // Get incomplete cycles for today
  async getIncompleteCyclesForDate(userId, date) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/study-cycles/incomplete/${userId}/${date}`, {
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
      const response = await fetch(`http://localhost:3000/api/study-cycles/move-incomplete`, {
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
  }
};
