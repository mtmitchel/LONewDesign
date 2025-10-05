import { Inbox, Send, FileText, Archive, Trash } from 'lucide-react';
import { Folder, Label, Email, Contact } from './types';

export const folders: Folder[] = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, count: 12, color: 'var(--primary)' },
  { id: 'sent', name: 'Sent', icon: Send, count: 0 },
  { id: 'drafts', name: 'Drafts', icon: FileText, count: 3 },
  { id: 'archive', name: 'Archive', icon: Archive, count: 0 },
  { id: 'trash', name: 'Trash', icon: Trash, count: 2 },
];

export const labels: Label[] = [
  { id: 'work', name: 'Work', color: 'var(--info)' },
  { id: 'personal', name: 'Personal', color: 'var(--success)' },
  { id: 'urgent', name: 'Urgent', color: 'var(--accent-coral)' },
];

export const emails: Email[] = [
  {
    id: 1,
    sender: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    subject: 'Q4 Marketing Strategy Review',
    preview: 'Hi team, I wanted to share the Q4 marketing strategy document...',
    body: 'Hi team,\\n\\nI wanted to share the Q4 marketing strategy document for your review. The strategy focuses on three key areas:\\n\\n• Digital transformation initiatives\\n• Customer retention programs\\n• Brand awareness campaigns\\n\\nPlease review the attached document and provide your feedback by Friday. We will discuss this in detail during our next team meeting.\\n\\nBest regards,\\nSarah',
    time: '10:30 AM',
    date: 'Today',
    unread: true,
    starred: false,
    hasAttachment: true,
    labels: ['work'],
  },
  {
    id: 2,
    sender: 'Design Team',
    email: 'design@company.com',
    subject: 'New Brand Guidelines Available',
    preview: 'The updated brand guidelines are now available in the shared folder...',
    body: 'Hello everyone,\\n\\nThe updated brand guidelines are now available in the shared folder. The new guidelines include:\\n\\n• Updated color palette\\n• New typography specifications\\n• Logo usage guidelines\\n• Template library\\n\\nPlease make sure to use these guidelines for all upcoming projects. If you have any questions, feel free to reach out.\\n\\nCheers,\\nDesign Team',
    time: '9:15 AM',
    date: 'Today',
    unread: true,
    starred: true,
    hasAttachment: false,
    labels: ['work'],
  },
  {
    id: 3,
    sender: 'Alex Rodriguez',
    email: 'alex.r@freelance.com',
    subject: 'Project Delivery Timeline',
    preview: 'Following up on our previous conversation about the project timeline...',
    body: 'Hi there,\\n\\nFollowing up on our previous conversation about the project timeline. Based on our discussion, here is the updated delivery schedule:\\n\\n• Phase 1: Design mockups - March 15th\\n• Phase 2: Development - April 10th\\n• Phase 3: Testing & QA - April 25th\\n• Final delivery - May 1st\\n\\nLet me know if this timeline works for you or if we need to adjust anything.\\n\\nBest,\\nAlex',
    time: 'Yesterday',
    date: 'March 12',
    unread: false,
    starred: false,
    hasAttachment: true,
    labels: ['work', 'urgent'],
  },
  {
    id: 4,
    sender: 'Team Calendar',
    email: 'noreply@calendar.com',
    subject: 'Weekly Team Standup - Tomorrow 10 AM',
    preview: 'Reminder: Weekly team standup meeting scheduled for tomorrow...',
    body: 'This is a reminder for the weekly team standup meeting.\\n\\nWhen: Tomorrow at 10:00 AM\\nWhere: Conference Room B / Zoom Link\\nDuration: 30 minutes\\n\\nAgenda:\\n• Sprint progress review\\n• Blocker discussions\\n• Next week planning\\n\\nPlease come prepared with your updates.',
    time: '2:30 PM',
    date: 'Yesterday',
    unread: false,
    starred: false,
    hasAttachment: false,
    labels: ['work'],
  },
  {
    id: 5,
    sender: 'John Miller',
    email: 'john.miller@personal.com',
    subject: 'Weekend Hiking Plans',
    preview: 'Hey! Are you still up for the hiking trip this weekend?',
    body: 'Hey!\\n\\nAre you still up for the hiking trip this weekend? I was thinking we could try the Blue Mountain trail - it is supposed to have amazing views this time of year.\\n\\nThe weather forecast looks good, mostly sunny with temperatures around 70°F.\\n\\nLet me know if you are still interested and we can plan the details!\\n\\nCheers,\\nJohn',
    time: 'Monday',
    date: 'March 11',
    unread: false,
    starred: true,
    hasAttachment: false,
    labels: ['personal'],
  },
];

export const contactSuggestions: Contact[] = [
  { email: 'sarah.wilson@company.com', name: 'Sarah Wilson' },
  { email: 'mike.johnson@client.com', name: 'Mike Johnson' },
  { email: 'team@company.com', name: 'Team' },
  { email: 'support@company.com', name: 'Support Team' }
];