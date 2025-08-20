// Enhanced Message Types per il sistema di messaggistica moderno

export interface User {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

export interface Reaction {
  emoji: string;
  users: string[]; // Array di user IDs
  count: number;
}

export interface Message {
  _id: string;
  content: string;
  senderId: string;
  sender: User;
  recipientId?: string;
  recipient?: User;
  conversationId: string;
  parentId?: string; // Per threading/reply
  messageType: MessageType;
  priority: MessagePriority;
  attachments: Attachment[];
  reactions: Reaction[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  readBy: ReadStatus[];
  createdAt: Date;
  updatedAt: Date;
  
  // Per messaggi di sistema
  isSystemMessage?: boolean;
  systemType?: SystemMessageType;
  
  // Per mention e hashtag
  mentions?: string[]; // Array di user IDs menzionati
  hashtags?: string[];
  
  // Per messaggi temporanei (che si auto-distruggono)
  expiresAt?: Date;
  isExpired?: boolean;
}

export interface Conversation {
  _id: string;
  participants: User[];
  isGroup: boolean;
  groupName?: string;
  groupDescription?: string;
  groupAvatar?: string;
  adminIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  mutedBy: string[]; // Array di user IDs che hanno mutato la conversazione
  pinnedBy: string[]; // Array di user IDs che hanno pinnato la conversazione
  createdAt: Date;
  updatedAt: Date;
  
  // Impostazioni conversazione
  settings: ConversationSettings;
}

export interface ConversationSettings {
  allowFileSharing: boolean;
  allowReactions: boolean;
  messageRetention: number; // giorni, 0 = forever
  requireApprovalForJoin: boolean;
  autoDeleteAfter?: number; // ore per auto-delete messaggi
}

export interface ReadStatus {
  userId: string;
  readAt: Date;
  messageId: string;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  startedAt: Date;
}

export interface MessageDraft {
  conversationId: string;
  content: string;
  parentId?: string;
  attachments: File[];
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  LINK = 'link',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  GIF = 'gif',
  POLL = 'poll',
  EVENT = 'event' // Per inviti a eventi calendario
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum SystemMessageType {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_ADDED = 'user_added',
  USER_REMOVED = 'user_removed',
  GROUP_CREATED = 'group_created',
  GROUP_RENAMED = 'group_renamed',
  GROUP_AVATAR_CHANGED = 'group_avatar_changed',
  ADMIN_PROMOTED = 'admin_promoted',
  ADMIN_DEMOTED = 'admin_demoted',
  SETTINGS_CHANGED = 'settings_changed'
}

export interface MessageSearchFilter {
  query?: string;
  senderId?: string;
  conversationId?: string;
  messageType?: MessageType;
  hasAttachments?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  priority?: MessagePriority;
  mentions?: string;
  hashtags?: string;
}

export interface MessageSearchResult {
  messages: Message[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  suggestions?: string[];
}

export interface MessageStats {
  totalMessages: number;
  totalConversations: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  avgResponseTime: number; // in minutes
  mostActiveConversation: {
    conversationId: string;
    messageCount: number;
  };
  messagesByType: Record<MessageType, number>;
  messagesByDay: Array<{
    date: string;
    count: number;
  }>;
  topEmojis: Array<{
    emoji: string;
    count: number;
  }>;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
  status?: 'available' | 'busy' | 'away' | 'invisible';
  customStatus?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  muteUntil?: Date;
  mutedConversations: string[];
  keywordAlerts: string[];
  doNotDisturbStart?: string; // HH:mm format
  doNotDisturbEnd?: string; // HH:mm format
}

export interface MessageFormData {
  content: string;
  recipient?: string;
  conversationId?: string;
  parentId?: string;
  messageType: MessageType;
  priority: MessagePriority;
  attachments: File[];
  mentions: string[];
  hashtags: string[];
  expiresIn?: number; // minutes until expiration
}

export interface ConversationListItem {
  conversation: Conversation;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  typingUsers: User[];
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
}

export enum WebSocketMessageType {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_UPDATED = 'message_updated',
  MESSAGE_DELETED = 'message_deleted',
  MESSAGE_READ = 'message_read',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  REACTION_ADDED = 'reaction_added',
  REACTION_REMOVED = 'reaction_removed',
  CONVERSATION_CREATED = 'conversation_created',
  CONVERSATION_UPDATED = 'conversation_updated',
  USER_JOINED_CONVERSATION = 'user_joined_conversation',
  USER_LEFT_CONVERSATION = 'user_left_conversation'
}

export interface EmojiPickerData {
  categories: Record<string, string[]>;
  recent: string[];
  frequent: Array<{ emoji: string; count: number }>;
}

export interface MessageError {
  type: 'network' | 'validation' | 'permission' | 'rate_limit' | 'server';
  message: string;
  code?: string;
  details?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface MessageThread {
  parentMessage: Message;
  replies: Message[];
  totalReplies: number;
  pagination: PaginationInfo;
}

export interface MessageAction {
  id: string;
  label: string;
  icon: string;
  action: (message: Message) => void;
  condition?: (message: Message) => boolean;
  disabled?: boolean;
}

export interface ConversationAction {
  id: string;
  label: string;
  icon: string;
  action: (conversation: Conversation) => void;
  condition?: (conversation: Conversation) => boolean;
  disabled?: boolean;
} 