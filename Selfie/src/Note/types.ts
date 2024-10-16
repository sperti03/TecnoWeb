export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
  
  export type SortCriteria = 'title' | 'date' | 'length';
  