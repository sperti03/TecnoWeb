// idTousernameConverter.ts
import { ObjectId } from 'mongodb'; // Se usi MongoDB

export const idToUsername = async (id: string | ObjectId): Promise<string | null> => {
  // Assicurati che l'ID sia una stringa prima di usarlo in una query
  const idString = typeof id === 'string' ? id : id.toString();
  
  const response = await fetch(`/api/user/${idString}`); // Modifica con l'URL corretto
  if (!response.ok) {
    console.error('Errore nel recupero dello username', response.status);
    return null; // Restituisce null in caso di errore
  }
  const user = await response.json();
  return user.username || null; // Restituisce lo username o null
};
