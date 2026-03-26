import type { Review } from '@/types';

export const reviews: Review[] = [
  {
    id: '1',
    customer_name: 'Marek K.',
    customerName: 'Marek K.',
    avatar: '',
    rating: 5,
    comment: 'Swietna obsluga i profesjonalne podejscie. Szymon zna sie na rzeczy!',
    date: '2024-01-15',
    created_at: '2024-01-15',
    is_approved: true,
  },
  {
    id: '2',
    customer_name: 'Piotr W.',
    customerName: 'Piotr W.',
    avatar: '',
    rating: 5,
    comment: 'Najlepszy fryzjer w Nysie. Polecam kazdemu!',
    date: '2024-02-20',
    created_at: '2024-02-20',
    is_approved: true,
  },
  {
    id: '3',
    customer_name: 'Adam S.',
    customerName: 'Adam S.',
    avatar: '',
    rating: 4,
    comment: 'Dobra robota, bardzo ladnie ostrzyzony. Na pewno wroce.',
    date: '2024-03-10',
    created_at: '2024-03-10',
    is_approved: true,
  },
];
