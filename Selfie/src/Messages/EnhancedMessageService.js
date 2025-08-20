// Enhanced Message Service con funzionalità moderne
const API_BASE = '/api/messages';

export const EnhancedMessageService = {
  // Send message con supporto allegati e emoji
  async sendMessage(messageData) {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token non trovato');
    }

    const formData = new FormData();
    formData.append('content', messageData.content);
    formData.append('recipient', messageData.recipient);
    
    if (messageData.parentId) {
      formData.append('parentId', messageData.parentId); // Per threading
    }
    
    if (messageData.messageType) {
      formData.append('messageType', messageData.messageType);
    }
    
    if (messageData.priority) {
      formData.append('priority', messageData.priority);
    }

    // Aggiungi allegati se presenti
    if (messageData.attachments && messageData.attachments.length > 0) {
      messageData.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
    }

    const response = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Errore durante l'invio del messaggio: ${errorMessage}`);
    }

    return await response.json();
  },

  // Get conversations con threading
  async getConversations() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero delle conversazioni');
    }

    return await response.json();
  },

  // Get messages di una conversazione specifica
  async getConversationMessages(conversationId, page = 1, limit = 20) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/conversation/${conversationId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero dei messaggi');
    }

    return await response.json();
  },

  // Mark messages as read
  async markAsRead(messageIds) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ messageIds }),
    });

    if (!response.ok) {
      throw new Error('Errore nella marcatura come letto');
    }

    return await response.json();
  },

  // Delete message
  async deleteMessage(messageId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nell\'eliminazione del messaggio');
    }

    return await response.json();
  },

  // Edit message
  async editMessage(messageId, newContent) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content: newContent }),
    });

    if (!response.ok) {
      throw new Error('Errore nella modifica del messaggio');
    }

    return await response.json();
  },

  // Add reaction to message
  async addReaction(messageId, emoji) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/${messageId}/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    });

    if (!response.ok) {
      throw new Error('Errore nell\'aggiunta della reazione');
    }

    return await response.json();
  },

  // Remove reaction from message
  async removeReaction(messageId, emoji) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/${messageId}/reaction`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    });

    if (!response.ok) {
      throw new Error('Errore nella rimozione della reazione');
    }

    return await response.json();
  },

  // Search messages
  async searchMessages(query, filters = {}) {
    const token = localStorage.getItem('token');
    
    const queryParams = new URLSearchParams({
      q: query,
      ...filters
    });
    
    const response = await fetch(`${API_BASE}/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nella ricerca dei messaggi');
    }

    return await response.json();
  },

  // Get unread count
  async getUnreadCount() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero dei messaggi non letti');
    }

    return await response.json();
  },

  // Start typing indicator
  async startTyping(conversationId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/typing/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId }),
    });

    return response.ok;
  },

  // Stop typing indicator
  async stopTyping(conversationId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/typing/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId }),
    });

    return response.ok;
  },

  // Get online users
  async getOnlineUsers() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/online-users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero degli utenti online');
    }

    return await response.json();
  },

  // Download attachment
  async downloadAttachment(messageId, attachmentId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/${messageId}/attachment/${attachmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel download dell\'allegato');
    }

    return response.blob();
  },

  // Block/Unblock user
  async toggleBlockUser(userId, block = true) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/block-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, block }),
    });

    if (!response.ok) {
      throw new Error('Errore nel blocco/sblocco utente');
    }

    return await response.json();
  },

  // Get message statistics
  async getMessageStats() {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero delle statistiche');
    }

    return await response.json();
  }
};

// Emoji picker utility
export const EmojiService = {
  popularEmojis: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '👍', '👎', '👌', '✨', '🎉', '❤️', '💕', '💖', '💗', '💙',
    '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💞'
  ],

  categories: {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'],
    'Love': ['😍', '🥰', '😘', '😗', '😙', '😚', '❤️', '💕', '💖', '💗'],
    'Celebration': ['🎉', '🥳', '🎊', '🎈', '🎁', '🎂', '🍰', '🎇', '🎆', '✨'],
    'Thumbs': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉'],
    'Nature': ['🌱', '🌿', '🍀', '🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌲']
  },

  // Get random emoji
  getRandomEmoji() {
    return this.popularEmojis[Math.floor(Math.random() * this.popularEmojis.length)];
  },

  // Search emojis
  searchEmojis(query) {
    const emojiData = {
      'happy': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊'],
      'love': ['😍', '🥰', '😘', '❤️', '💕', '💖', '💗', '💙', '💚'],
      'sad': ['😢', '😭', '😞', '😔', '😟', '😕', '🙁', '☹️'],
      'angry': ['😠', '😡', '🤬', '😤', '💢', '👿'],
      'party': ['🎉', '🥳', '🎊', '🎈', '🎁', '🎂'],
      'thumbs': ['👍', '👎', '👌', '✌️', '🤞']
    };

    const results = [];
    Object.keys(emojiData).forEach(key => {
      if (key.includes(query.toLowerCase())) {
        results.push(...emojiData[key]);
      }
    });

    return [...new Set(results)]; // Remove duplicates
  }
};

// WebSocket service per real-time messaging
export class MessageWebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      this.ws = new WebSocket(`ws://localhost:8000/ws/messages?token=${token}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }
}

export default EnhancedMessageService; 