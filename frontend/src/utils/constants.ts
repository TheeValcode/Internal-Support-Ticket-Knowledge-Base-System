export const TICKET_CATEGORIES = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'network', label: 'Network' },
  { value: 'access', label: 'Access' },
  { value: 'other', label: 'Other' }
] as const;

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'red' },
  { value: 'critical', label: 'Critical', color: 'red' }
] as const;

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'resolved', label: 'Resolved', color: 'green' },
  { value: 'closed', label: 'Closed', color: 'gray' }
] as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TICKETS: '/tickets',
  TICKET_DETAIL: '/tickets/:id',
  CREATE_TICKET: '/tickets/new',
  KNOWLEDGE_BASE: '/knowledge',
  ARTICLE_DETAIL: '/knowledge/:id',
  ADMIN: '/admin',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_ARTICLES: '/admin/articles',
  ADMIN_USERS: '/admin/users'
} as const;