export interface TodoItem {
  text: string;
  checked: boolean;
  deadline?: string; // ISO date string
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: Date;
  userId: string; // autore
  accessType: 'public' | 'private' | 'limited';
  accessList: string[]; // utenti che possono accedere (solo se limited)
  todos?: TodoItem[]; // opzionale: lista di to-do
}

export type SortCriteria = 'title' | 'date' | 'length';
  