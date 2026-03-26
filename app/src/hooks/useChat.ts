import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, FaceShape } from '@/types';
import { 
  getRecommendationForFaceShape, 
  getTrendyHairstyles, 
  getRandomHairCareTip,
  servicesKnowledge 
} from '@/data/knowledgeBase';
import { services } from '@/data/services';

// Simple keyword-based response system (simulating RAG)
const generateResponse = (userMessage: string, _context: Record<string, unknown>): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Greeting
  if (lowerMessage.match(/cześć|witaj|hej|dzień dobry|dobry wieczór/)) {
    return 'Cześć! Jestem asystentem salonu fryzjerskiego Szymon. Mogę Ci pomóc z:\n\n• Wyborem fryzury dopasowanej do kształtu twarzy\n• Informacjami o naszych usługach i cenach\n• Aktualnymi trendami w fryzjerstwie\n• Wskazówkami pielęgnacyjnymi\n• Rezerwacją wizyty\n\nW czym mogę pomóc?';
  }
  
  // Face shape detection and recommendations
  if (lowerMessage.match(/twarz|kształt|owalna|okrągła|kwadratowa|serce|podłużna|diament/)) {
    let faceShape: FaceShape | null = null;
    
    if (lowerMessage.includes('owal')) faceShape = 'oval';
    else if (lowerMessage.includes('okrągł')) faceShape = 'round';
    else if (lowerMessage.includes('kwadrat')) faceShape = 'square';
    else if (lowerMessage.includes('serce') || lowerMessage.includes('serca')) faceShape = 'heart';
    else if (lowerMessage.includes('podłużn')) faceShape = 'long';
    else if (lowerMessage.includes('diament')) faceShape = 'diamond';
    
    if (faceShape) {
      const recommendation = getRecommendationForFaceShape(faceShape);
      return `Dla twarzy ${faceShape === 'oval' ? 'owalnej' : faceShape === 'round' ? 'okrągłej' : faceShape === 'square' ? 'kwadratowej' : faceShape === 'heart' ? 'w kształcie serca' : faceShape === 'long' ? 'podłużnej' : 'diamentowej'} polecam:\n\n**Fryzury:**\n${recommendation.hairstyles.map(h => `• ${h}`).join('\n')}\n\n${recommendation.description}\n\n**Polecane usługi:**\n${recommendation.services.map(s => `• ${s}`).join('\n')}`;
    }
    
    return 'Aby doradzić najlepszą fryzurę, powiedz mi jaki masz kształt twarzy:\n\n• **Owalna** - najbardziej uniwersalna\n• **Okrągła** - szerokość i długość podobne\n• **Kwadratowa** - mocna szczęka, szerokie czoło\n• **Serce** - szerokie czoło, wąski podbródek\n• **Podłużna** - dłuższa niż szersza\n• **Diament** - wysokie kości policzkowe, wąskie czoło i broda';
  }
  
  // Trendy hairstyles
  if (lowerMessage.match(/trend|modne|popularne|2024|2025|styl/)) {
    const trends = getTrendyHairstyles();
    return `**Najmodniejsze fryzury męskie 2024/2025:**\n\n${trends.map((t, i) => `${i + 1}. **${t.name}**\n   ${t.description}\n   Pielęgnacja: ${t.maintenance}\n`).join('\n')}\nKtóry styl Cię interesuje? Mogę powiedzieć więcej o konkretnej fryzurze!`;
  }
  
  // Services and pricing
  if (lowerMessage.match(/cena|cennik|usługa|ile kosztuje|ceny|koszt/)) {
    return `**Nasz cennik usług:**\n\n${services.map((s: {name: string, price: number, duration: number}) => `• **${s.name}** - ${s.price} PLN (${s.duration} min)`).join('\n')}\n\nCzy chcesz dowiedzieć się więcej o konkretnej usłudze?`;
  }
  
  // Specific service inquiry
  for (const [serviceName, info] of Object.entries(servicesKnowledge)) {
    if (lowerMessage.includes(serviceName.toLowerCase()) || 
        lowerMessage.includes(serviceName.split(' ')[0].toLowerCase())) {
      return `**${serviceName}**\n\n⏱️ Czas trwania: ${info.duration}\n💰 Cena: ${info.price}\n\n**W cenie usługi:**\n${info.includes.map(i => `• ${i}`).join('\n')}\n\n💡 ${info.recommendation}`;
    }
  }
  
  // Hair care tips
  if (lowerMessage.match(/pielęgnacja|wskazówki|rada|jak dbać|szampon|odżywka/)) {
    const tip = getRandomHairCareTip();
    return `**Wskazówka pielęgnacyjna:**\n\n${tip}\n\nCzy chcesz więcej porad dotyczących pielęgnacji włosów?`;
  }
  
  // Beard
  if (lowerMessage.match(/broda|zarost|wąsy|brodę/)) {
    return `**Poradnik brody:**\n\n**Rodzaje brody:**\n\n• **Zarost (stubble)** - 1-3mm, najniższa pielęgnacja\n• **Krótka broda** - 3-5mm, wymaga regularnego podcinania\n• **Średnia broda** - 1-2cm, najpopularniejsza opcja\n• **Długa broda** - powyżej 2cm, wymaga olejków i balsamu\n\nOferujemy profesjonalne strzyżenie brody za 50 PLN. Polecam też nasze **Combo** - włosy + broda za 110 PLN!`;
  }
  
  // Booking
  if (lowerMessage.match(/rezerwacja|umówić|wizyta|termin|zapisać/)) {
    return 'Aby zarezerwować wizytę, kliknij przycisk "Umów się" w górnym menu lub przejdź do sekcji "Rezerwacja".\n\nMożesz wybrać:\n• Usługę\n• Fryzjera\n• Datę i godzinę\n\nCzy potrzebujesz pomocy z wyborem usługi?';
  }
  
  // Team
  if (lowerMessage.match(/fryzjer|zespół|kto|szymon|ola|wiola|personel/)) {
    return `**Nasz zespół:**\n\n• **Szymon** - Mistrz fryzjerstwa, założyciel salonu\n• **Ola** - Stylistka, specjalistka od koloryzacji\n• **Wiola** - Kolorystka, ekspertka w pielęgnacji\n\nWszyscy nasi fryzjerzy mają wieloletnie doświadczenie i regularnie podnoszą swoje kwalifikacje.`;
  }
  
  // Hours and location
  if (lowerMessage.match(/godziny|otwarte|adres|lokalizacja|gdzie|kontakt/)) {
    return `**Godziny otwarcia:**\n\n• Poniedziałek - Piątek: 9:00 - 18:00\n• Sobota: 9:00 - 14:00\n• Niedziela: Zamknięte\n\n**Adres:**\nul. Gałczyńskiego 47a\n48-303 Nysa\n\n**Kontakt:**\n📞 Telefon: +48 123 456 789\n📧 Email: kontakt@fryzjerszymon.pl`;
  }
  
  // Thank you
  if (lowerMessage.match(/dzięki|dziękuję|super|świetnie|ok/)) {
    return 'Świetnie! Czy mogę pomóc w czymś jeszcze? Jeśli chcesz zarezerwować wizytę, kliknij przycisk "Umów się" na górze strony.';
  }
  
  // Default response
  return 'Rozumiem! Mogę Ci pomóc z:\n\n• 🎨 **Doborem fryzury** - powiedz mi jaki masz kształt twarzy\n• 💇 **Informacjami o usługach** - ceny, czas trwania\n• 🔥 **Aktualnymi trendami** - najmodniejsze fryzury 2024/2025\n• 💡 **Wskazówkami pielęgnacyjnymi**\n• 📅 **Rezerwacją wizyty**\n\nW czym mogę pomóc?';
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Cześć! Jestem asystentem salonu fryzjerskiego Szymon. Mogę Ci pomóc z wyborem fryzury, informacjami o usługach, aktualnymi trendami lub rezerwacją wizyty. W czym mogę pomóc?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const response = generateResponse(content, {});
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      
      // Scroll to bottom after message is added
      setTimeout(scrollToBottom, 100);
    }, 800 + Math.random() * 700); // Random delay between 800-1500ms
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Cześć! Jestem asystentem salonu fryzjerskiego Szymon. Mogę Ci pomóc z wyborem fryzury, informacjami o usługach, aktualnymi trendami lub rezerwacją wizyty. W czym mogę pomóc?',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  return {
    messages,
    isTyping,
    isOpen,
    sendMessage,
    toggleChat,
    closeChat,
    openChat,
    clearMessages,
    messagesEndRef,
  };
};
