export interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: Date;
  userId: string;
}

  export type SortCriteria = 'title' | 'date' | 'length';
  