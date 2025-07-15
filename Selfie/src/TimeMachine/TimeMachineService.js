

export const getTime = async () => {
  const response = await fetch('http://localhost:3000/api/gettime');
  if (!response.ok) {
    throw new Error('Errore nel recupero del tempo corrente');
  }
  const data = await response.json();
  return new Date(data.time);
};

export const setTime = async (time) => {
  const response = await fetch('http://localhost:3000/api/settime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time: time.toISOString() })
  });
  if (!response.ok) {
    throw new Error('Errore durante l\'impostazione del tempo');
  }
  const data = await response.json();
  return new Date(data.time);
};

export const resetTime = async () => {
  const response = await fetch(`${'http://localhost:3000/api/time'}/reset`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Errore durante il reset del tempo');
  }
  const data = await response.json();
  return new Date(data.time);
};

export const advanceTime = async (milliseconds) => {
  const response = await fetch(`${'http://localhost:3000/api/time'}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ milliseconds })
  });
  if (!response.ok) {
    throw new Error('Errore durante l\'avanzamento del tempo');
  }
  const data = await response.json();
  return new Date(data.time);
};
