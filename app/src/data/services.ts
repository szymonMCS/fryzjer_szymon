import type { Service } from '@/types';

export const services: Service[] = [
  {
    id: '1',
    name: 'Strzyżenie męskie',
    description: 'Klasyczne strzyżenie włosów z użyciem maszynki i nożyczek. Obejmuje mycie, strzyżenie i stylizację.',
    price: 70,
    duration: 30,
    image: '/images/service-haircut.jpg',
    category: 'haircut'
  },
  {
    id: '2',
    name: 'Strzyżenie brody',
    description: 'Precyzyjne modelowanie brody z użyciem maszynki i nożyczek. Czas trwania około 20 minut.',
    price: 50,
    duration: 20,
    image: '/images/service-beard.jpg',
    category: 'beard'
  },
  {
    id: '3',
    name: 'Combo - Włosy + Broda',
    description: 'Kompleksowa usługa obejmująca strzyżenie włosów i brody w jednym. Oszczędź czas i pieniądze!',
    price: 110,
    duration: 50,
    image: '/images/service-combo.jpg',
    category: 'combo'
  },
  {
    id: '4',
    name: 'Koloryzacja włosów',
    description: 'Profesjonalna koloryzacja włosów z użyciem premium produktów. Konsultacja w cenie.',
    price: 150,
    duration: 90,
    image: '/images/service-coloring.jpg',
    category: 'coloring'
  },
  {
    id: '5',
    name: 'Odsiwianie',
    description: 'Naturalne odsiwianie włosów dla mężczyzn. Subtelny efekt, który odmłodzi Twój wygląd.',
    price: 130,
    duration: 60,
    image: '/images/service-gray.jpg',
    category: 'coloring'
  },
  {
    id: '6',
    name: 'Dredy',
    description: 'Tworzenie i pielęgnacja dredów. Konsultacja i dobór odpowiedniej metody.',
    price: 200,
    duration: 180,
    image: '/images/service-dreads.jpg',
    category: 'other'
  },
  {
    id: '7',
    name: 'Wzory na głowie',
    description: 'Kreatywne wzory i wytatuowane linie na głowie. Precyzyjna praca maszynką.',
    price: 80,
    duration: 40,
    image: '/images/service-pattern.jpg',
    category: 'haircut'
  },
  {
    id: '8',
    name: 'Trwała ondulacja',
    description: 'Klasyczna trwała ondulacja dla mężczyzn. Długotrwały efekt kręconych włosów.',
    price: 120,
    duration: 75,
    image: '/images/service-perm.jpg',
    category: 'other'
  }
];

export const getServiceById = (id: string): Service | undefined => {
  return services.find(service => service.id === id);
};

export const getServicesByCategory = (category: Service['category']): Service[] => {
  return services.filter(service => service.category === category);
};
