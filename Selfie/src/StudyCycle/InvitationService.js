// InvitationService.js - Frontend service for invitation management

const API_BASE_URL = '/api/invitations';

export const InvitationService = {
  // Send study invitation
  async sendInvitation(invitationData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(invitationData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send invitation: ${error}`);
    }

    return response.json();
  },

  // Get received invitations
  async getReceivedInvitations() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/received`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch received invitations');
    }

    return response.json();
  },

  // Get sent invitations
  async getSentInvitations() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/sent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sent invitations');
    }

    return response.json();
  },

  // Accept invitation
  async acceptInvitation(invitationId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/${invitationId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to accept invitation');
    }

    return response.json();
  },

  // Decline invitation
  async declineInvitation(invitationId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/${invitationId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to decline invitation');
    }

    return response.json();
  },

  // Get session info
  async getSessionInfo(sessionId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session info');
    }

    return response.json();
  },

  // End shared session
  async endSession(sessionId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to end session');
    }

    return response.json();
  }
};
