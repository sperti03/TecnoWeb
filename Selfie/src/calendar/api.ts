import { Event, Resource } from './types';

const API = 'http://localhost:8000/api';

export async function fetchEvents(token: string): Promise<Event[]> {
  const res = await fetch(`${API}/events`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Errore fetch eventi');
  return res.json();
}

export async function createEvent(event: Partial<Event>, token: string): Promise<Event> {
  const res = await fetch(`${API}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(event)
  });
  if (!res.ok) throw new Error('Errore creazione evento');
  return res.json();
}

export async function deleteEvent(id: string, token: string) {
  const res = await fetch(`${API}/events/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Errore cancellazione evento');
}

export async function respondInvite(id: string, status: 'accepted'|'declined', token: string) {
  const res = await fetch(`${API}/events/${id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Errore risposta invito');
}

export async function exportICS(token: string): Promise<Blob> {
  const res = await fetch(`${API}/events/export`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Errore esportazione .ics');
  return res.blob();
}

export async function fetchResources(token: string): Promise<Resource[]> {
  const res = await fetch(`${API}/resources`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Errore fetch risorse');
  return res.json();
}

export async function createResource(name: string, type: string, token: string) {
  const res = await fetch(`/api/resources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, type })
  });
  if (!res.ok) throw new Error('Errore creazione risorsa');
  return res.json();
} 