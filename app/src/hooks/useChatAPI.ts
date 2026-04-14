import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/types';
import { askQuestion } from '@/services/ragApi';

interface UseChatAPIState {
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
  error: string | null;
}

interface UseChatAPIReturn extends UseChatAPIState {
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  closeChat: () => void;
  openChat: () => void;
  clearMessages: () => void;
  clearError: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Cześć! Jestem asystentem AI salonu fryzjerskiego Szymon. Mogę Ci pomóc z wyborem fryzury, informacjami o usługach, aktualnymi trendami lub rezerwacją wizyty. W czym mogę pomóc?',
  timestamp: new Date().toISOString(),
};

export const useChatAPI = (): UseChatAPIReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = useCallback(async (content: string) => {
    // Clear any previous error
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare history for RAG (last 20 messages)
      const history = messages
        .slice(-20)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Call RAG API
      const response = await askQuestion({
        query: content,
        history: history.length > 0 ? history : undefined,
        session_id: sessionId,
      });

      // Save session_id for next requests
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd podczas komunikacji z asystentem AI';
      setError(errorMessage);
      
      // Add error message as assistant response
      const errorAssistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd podczas przetwarzania Twojego pytania. Proszę spróbować ponownie za chwilę.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsTyping(false);
      // Scroll to bottom after message is added
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

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
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setSessionId(undefined);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    isOpen,
    error,
    sendMessage,
    toggleChat,
    closeChat,
    openChat,
    clearMessages,
    clearError,
    messagesEndRef,
  };
};

export default useChatAPI;
