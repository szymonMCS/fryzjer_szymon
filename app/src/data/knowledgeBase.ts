import type { FaceShape, HairstyleRecommendation } from '@/types';

export const faceShapeGuide: Record<FaceShape, HairstyleRecommendation> = {
  oval: {
    faceShape: 'oval',
    hairstyles: ['Buzz cut', 'Side part', 'Quiff', 'Crew cut', 'Slick back'],
    description: 'Twórz owalna to najbardziej uniwersalny kształt. Pasuje Ci prawie każda fryzura!',
    services: ['Strzyżenie męskie', 'Combo - Włosy + Broda']
  },
  round: {
    faceShape: 'round',
    hairstyles: ['Pompadour', 'High fade', 'Side swept', 'Textured crop', 'Undercut'],
    description: 'Twarz okrągła wymaga fryzur, które wydłużą i wyszczuplą twarz. Unikaj równych długości z boku.',
    services: ['Strzyżenie męskie', 'Wzory na głowie']
  },
  square: {
    faceShape: 'square',
    hairstyles: ['Crew cut', 'Buzz cut', 'Side part', 'Textured fringe', 'Short pompadour'],
    description: 'Twarz kwadratowa z mocną szczęką. Krótkie, klasyczne fryzury podkreślają Twoje rysy.',
    services: ['Strzyżenie męskie', 'Strzyżenie brody']
  },
  heart: {
    faceShape: 'heart',
    hairstyles: ['Side swept', 'Textured crop', 'Medium length', 'Layered cut', 'Fringe'],
    description: 'Twarz w kształcie serca z szerszą czołą. Fryzury z objętością przy brodzie równoważą proporcje.',
    services: ['Strzyżenie męskie', 'Trwała ondulacja']
  },
  long: {
    faceShape: 'long',
    hairstyles: ['Side part', 'Crew cut', 'Buzz cut', 'Short textured', 'Medium fade'],
    description: 'Twarz podłużna wymaga fryzur, które nie wydłużają dodatkowo. Unikaj wysokich czesanek.',
    services: ['Strzyżenie męskie', 'Combo - Włosy + Broda']
  },
  diamond: {
    faceShape: 'diamond',
    hairstyles: ['Textured crop', 'Fringe', 'Side swept', 'Medium length', 'Layered cut'],
    description: 'Twarz diamentowa z wysokimi kośćmi policzkowymi. Fryzury z objętością na czubku i grzywką pasują idealnie.',
    services: ['Strzyżenie męskie', 'Trwała ondulacja']
  }
};

export const trendyHairstyles2024 = [
  {
    name: 'Textured Crop',
    description: 'Krótka, teksturowana fryzura z dłuższym wierzchem i krótkimi bokami. Bardzo modna w 2024!',
    bestFor: ['oval', 'round', 'diamond'],
    maintenance: 'Niska',
    products: ['Matowy pasta', 'Sól morska']
  },
  {
    name: 'Modern Pompadour',
    description: 'Klasyczna czesanka z nowoczesnym twistem - mniej wysoka, bardziej naturalna.',
    bestFor: ['oval', 'square', 'round'],
    maintenance: 'Średnia',
    products: ['Pomada', 'Lakier']
  },
  {
    name: 'Buzz Cut with Fade',
    description: 'Bardzo krótkie włosy z płynnym przejściem fade. Eleganckie i łatwe w utrzymaniu.',
    bestFor: ['oval', 'square', 'long'],
    maintenance: 'Bardzo niska',
    products: ['Balsam po goleniu']
  },
  {
    name: 'Slick Back Undercut',
    description: 'Dłuższe włosy na górze zaczesane do tyłu, krótkie boki. Elegancki i stylowy look.',
    bestFor: ['oval', 'square', 'diamond'],
    maintenance: 'Średnia',
    products: ['Pomada na bazie oleju', 'Grzebień']
  },
  {
    name: 'Korean Curtain Hair',
    description: 'Dłuższe włosy opadające na czoło, popularny trend z Korei.',
    bestFor: ['oval', 'heart', 'round'],
    maintenance: 'Wysoka',
    products: ['Krem do włosów', 'Odżywka']
  },
  {
    name: 'Messy Quiff',
    description: 'Niechlujna, teksturowana wersja quiff. Casualowy i młodzieżowy styl.',
    bestFor: ['oval', 'round', 'heart'],
    maintenance: 'Niska',
    products: ['Matowa glinka', 'Sól morska']
  }
];

export const hairCareTips = [
  'Myj włosy 2-3 razy w tygodniu, nie codziennie - zachowasz naturalne oleje.',
  'Używaj szamponu dostosowanego do typu włosów.',
  'Zawsze używaj odżywki po szamponie.',
  'Susz włosy chłodnym lub letnim strumieniem powietrza.',
  'Stosuj produkty z filtrem UV, aby chronić kolor.',
  'Regularnie odwiedzaj fryzjera co 4-6 tygodni.',
  'Używaj naturalnych szczotek lub grzebieni z szerokimi zębami.',
  'Przed snem zwiń włosy w jedwabną chustkę, aby zapobiec plątaniu.'
];

export const beardGuide = {
  short: {
    name: 'Krótka broda',
    description: '3-5mm długości, wymaga regularnego podcinania co 2-3 dni.',
    bestFor: ['round', 'square'],
    maintenance: 'Wysoka'
  },
  medium: {
    name: 'Średnia broda',
    description: '1-2cm długości, najpopularniejsza opcja.',
    bestFor: ['oval', 'long', 'diamond'],
    maintenance: 'Średnia'
  },
  long: {
    name: 'Długa broda',
    description: 'Powyżej 2cm, wymaga pielęgnacji olejkami i balsamem.',
    bestFor: ['oval', 'long'],
    maintenance: 'Wysoka'
  },
  stubble: {
    name: 'Zarost (stubble)',
    description: '1-3mm, tzw. "5 o\'clock shadow".',
    bestFor: ['all'],
    maintenance: 'Niska'
  }
};

export const servicesKnowledge = {
  'Strzyżenie męskie': {
    duration: '30 minut',
    includes: ['Mycie włosów', 'Konsultacja', 'Strzyżenie', 'Stylizacja'],
    price: '70 PLN',
    recommendation: 'Nasz bestseller! Idealne dla każdego mężczyzny.'
  },
  'Strzyżenie brody': {
    duration: '20 minut',
    includes: ['Konsultacja', 'Modelowanie', 'Konturowanie', 'Pielęgnacja'],
    price: '50 PLN',
    recommendation: 'Podkreśl swoją męskość z perfekcyjnie przystrzyżoną brodą.'
  },
  'Combo - Włosy + Broda': {
    duration: '50 minut',
    includes: ['Wszystko z obu usług', 'Rabat', 'Kompleksowa metamorfoza'],
    price: '110 PLN',
    recommendation: 'Najlepsza wartość! Oszczędzasz 10 PLN.'
  },
  'Koloryzacja włosów': {
    duration: '90 minut',
    includes: ['Konsultacja koloru', 'Koloryzacja', 'Pielęgnacja', 'Stylizacja'],
    price: '150 PLN',
    recommendation: 'Chcesz odświeżyć look? To usługa dla Ciebie!'
  },
  'Odsiwianie': {
    duration: '60 minut',
    includes: ['Konsultacja', 'Aplikacja', 'Naturalny efekt'],
    price: '130 PLN',
    recommendation: 'Subtelne odmłodzenie bez efektu "farbowanych" włosów.'
  }
};

export const getRecommendationForFaceShape = (faceShape: FaceShape): HairstyleRecommendation => {
  return faceShapeGuide[faceShape];
};

export const getTrendyHairstyles = () => trendyHairstyles2024;

export const getRandomHairCareTip = (): string => {
  return hairCareTips[Math.floor(Math.random() * hairCareTips.length)];
};
