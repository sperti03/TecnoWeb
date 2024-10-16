export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string; // Aggiungi questo campo
  createdAt: Date;
  updatedAt: Date;
}
  
  export type SortCriteria = 'title' | 'date' | 'length';
  