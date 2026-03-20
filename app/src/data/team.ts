import type { TeamMember } from '@/types';

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Szymon',
    role: 'Mistrz Fryzjerstwa',
    description: 'Założyciel salonu z 15-letnim doświadczeniem. Specjalista w strzyżeniu klasycznym i nowoczesnych trendach.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    specialties: ['Strzyżenie klasyczne', 'Koloryzacja', 'Stylizacja weselna']
  },
  {
    id: '2',
    name: 'Ola',
    role: 'Stylistka',
    description: 'Kreatywna stylistka z pasją do nowoczesnych fryzur. Specjalizuje się w koloryzacji i stylizacji.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    specialties: ['Koloryzacja', 'Balayage', 'Strzyżenie damskie']
  },
  {
    id: '3',
    name: 'Wiola',
    role: 'Kolorystka',
    description: 'Ekspertka w koloryzacji i pielęgnacji włosów. Tworzy unikalne, spersonalizowane odcienie.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    specialties: ['Koloryzacja', 'Odsiwianie', 'Trwała ondulacja']
  }
];

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return teamMembers.find(member => member.id === id);
};
