export interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: Date;
  userId: string;
  AccessList: string[];
}

  export type SortCriteria = 'title' | 'date' | 'length';
  