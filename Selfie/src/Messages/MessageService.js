export const SendMessageToUser = async (content, dest) => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      throw new Error('Token non trovato');
    }
  
    const response = await fetch('/api/sendmessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content, dest }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Errore durante la creazione del messaggio: ${errorMessage}`);
    }

    const newMessage = await response.json();
    return newMessage;
  };
  

  export const getMessagesForUser = async (userId) => {
    const token = localStorage.getItem('token'); 
  
    const response = await fetch(`/api/getmessages?destId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero dei messaggi');
    }

    const messages = await response.json();
    return messages;
  };
  
  