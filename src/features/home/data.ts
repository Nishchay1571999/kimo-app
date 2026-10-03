import type { DayData, TimelineEntryData } from './types';

export const days: readonly DayData[] = [
  { day: 'Sun', date: '27', recorded: true },
  { day: 'Mon', date: '28', recorded: false },
  { day: 'Tue', date: '29', recorded: true },
  { day: 'Wed', date: '30', recorded: true },
  { day: 'Thu', date: '01', recorded: true },
  { day: 'Fri', date: '02', recorded: false },
  { day: 'Today', date: '03', recorded: true, active: true },
];

export const entries: readonly TimelineEntryData[] = [
  {
    id: '1',
    time: '12:30 PM',
    type: 'image',
    title: 'Lunch',
    description: 'Rice, vegetables, dal and curd.',
    image: 'https://picsum.photos/seed/kimbo-food/500/400',
  },
  {
    id: '2',
    time: '3:10 PM',
    type: 'audio',
    title: 'How I felt after lunch',
    description:
      'Felt slightly sleepy after lunch. Energy improved after some water.',
    duration: '0:24',
  },
  {
    id: '3',
    time: '6:20 PM',
    type: 'image',
    title: 'Evening walk',
    description: 'Walked outside for around 30 minutes.',
    image: 'https://picsum.photos/seed/kimbo-walk/500/400',
  },
  {
    id: '4',
    time: '9:45 PM',
    type: 'text',
    title: 'Medicine',
    description: 'Took the prescribed tablet after dinner.',
  },
  {
    id: '5',
    time: '11:30 PM',
    type: 'image',
    title: 'Health report',
    description: 'Uploaded my recent blood test report.',
    image: 'https://picsum.photos/seed/kimbo-report/500/400',
  },
  {
    id: '6',
    time: '7:15 AM',
    type: 'image',
    title: 'Breakfast',
    description: 'Eggs, toast and coffee.',
    image: 'https://picsum.photos/seed/kimbo-breakfast/500/400',
  },
  {
    id: '7',
    time: '9:20 AM',
    type: 'audio',
    title: 'Morning note',
    description: 'Feeling rested today. Slept better than yesterday.',
    duration: '0:18',
  },
];
