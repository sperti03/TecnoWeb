

export const getTime = async () => {
  const response = await fetch('/api/timemachine/gettime');
  if (!response.ok) {
    throw new Error('Errore nel recupero del tempo corrente');
  }
  const data = await response.json();
  return new Date(data.time);
};

export const setTime = async (time) => {
  const response = await fetch('/api/timemachine/settime', {
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
  const response = await fetch('/api/timemachine/reset', {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Errore durante il reset del tempo');
  }
  const data = await response.json();
  return new Date(data.time);
};

export const advanceTime = async (milliseconds) => {
  const response = await fetch('/api/timemachine/advance', {
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
