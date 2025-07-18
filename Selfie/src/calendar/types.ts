export interface InvitedUser {
  user: string; // userId
  status: 'pending' | 'accepted' | 'declined';
}

export interface Notification {
  system: boolean;
  email: boolean;
}

export interface Repeat {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  count?: number;
  until?: string;
}

export interface Event {
  _id?: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  createdBy: string;
  invitedUsers: InvitedUser[];
  notification: Notification;
  repeat: Repeat;
  resource?: string;
}

export interface Resource {
  _id: string;
  name: string;
  type: string;
} 