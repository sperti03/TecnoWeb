export const SendMessageToUser = async (content,username) => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      throw new Error('Token non trovato');
    }
  
    const response = await fetch('http://localhost:8000/api/sendmessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content, username }),
    });
  
    if (!response.ok) {
      const errorMessage = await response.text(); // Ottieni il messaggio d'errore dal server
      throw new Error(`Errore durante la creazione del messaggio: ${errorMessage}`);
    }
  
    const newMessage = await response.json();
    return newMessage;
  };
  

  export const getMessagesForUser = async (userId) => {
    const token = localStorage.getItem('token'); 
  
    const response = await fetch(`http://localhost:8000/api/getmessages?destId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
      },
    });
  
    if (!response.ok) {
      throw new Error('Errore nel recupero delle note');
    }
  
    const messages = await response.json();
    return messages;
  };
  
  