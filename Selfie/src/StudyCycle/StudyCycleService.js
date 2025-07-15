// StudyCycleService.js - Frontend service for study cycle management

const API_BASE_URL = 'http://localhost:3000/api/study-cycles';

export const StudyCycleService = {
  // Create a new study cycle
  async createStudyCycle(studyCycleData) {
    const token = localStorage.getItem('token');
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(studyCycleData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create study cycle: ${error}`);
    }

    return response.json();
  },

  // Get all study cycles for the user
  async getStudyCycles() {
    const token = localStorage.getItem('token');
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch study cycles');
    }

    return response.json();
  },

  // Update study cycle progress
  async updateProgress(cycleId, progressData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/${cycleId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(progressData),
    });

    if (!response.ok) {
      throw new Error('Failed to update progress');
    }

    return response.json();
  },

  // Complete a study cycle
  async completeStudyCycle(cycleId, completionData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/${cycleId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(completionData),
    });

    if (!response.ok) {
      throw new Error('Failed to complete study cycle');
    }

    return response.json();
  },

  // Trigger auto-rescheduling of incomplete cycles
  async rescheduleIncomplete() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reschedule-incomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reschedule incomplete cycles');
    }

    return response.json();
  },

  // Delete a study cycle
  async deleteStudyCycle(cycleId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/${cycleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete study cycle');
    }

    return response.json();
  },

  // Get study cycle by ID
  async getStudyCycleById(cycleId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/${cycleId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch study cycle');
    }

    return response.json();
  },

  // Get study cycle progress
  async getProgress(cycleId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/${cycleId}/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get progress');
    }

    return response.json();
  },
};
