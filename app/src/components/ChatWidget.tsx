import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Bot, User, Sparkles, Wand2 } from 'lucide-react';

const quickQuestions = [
  'Jaki kształt twarzy mam wybrać?',
  'Co jest teraz modne?',
  'Ile kosztuje strzyżenie?',
  'Jak dbać o brodę?',
];

export const ChatWidget = () => {
  const { messages, isTyping, isOpen, sendMessage, toggleChat, messagesEndRef } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  // Format message content with markdown-like styling
  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('•')) {
        return (
          <li
            key={i}
            className="ml-4 text-sm"
            dangerouslySetInnerHTML={{ __html: boldLine }}
          />
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <div
            key={i}
            className="ml-2 text-sm mt-2"
            dangerouslySetInnerHTML={{ __html: boldLine }}
          />
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return (
        <p
          key={i}
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: boldLine }}
        />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {/* Chat Window */}
      <div 
        className={`absolute bottom-24 right-0 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.35)' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Wand2 className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Asystent AI</h3>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Online - gotowy do pomocy
              </p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-black text-white rounded-br-none'
                    : 'bg-white shadow-lg border border-gray-100 rounded-bl-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'assistant' ? (
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="space-y-1">{formatMessage(message.content)}</div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-white shadow-lg border border-gray-100 rounded-2xl rounded-bl-none p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-yellow-500" />
              Szybkie pytania:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs bg-white border border-gray-200 rounded-full px-3 py-2 hover:bg-black hover:text-white hover:border-black transition-all"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Napisz wiadomość..."
              className="flex-1 rounded-full border-gray-200 focus:border-black"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="bg-black text-white hover:bg-gray-800 rounded-full w-12 h-12 p-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Button with Label */}
      <div className="relative flex items-center gap-3">
        {/* Tooltip */}
        {showTooltip && !isOpen && (
          <div className="absolute right-20 bg-black text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap animate-bounce">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Zapytaj o fryzurę!
            </span>
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-black rotate-45" />
          </div>
        )}

        {/* Button Label */}
        {!isOpen && (
          <span className="hidden md:block text-sm font-medium text-gray-700 bg-white/90 backdrop-blur px-3 py-2 rounded-full shadow-lg">
            Asystent AI
          </span>
        )}

        {/* Main Button */}
        <button
          onClick={toggleChat}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isOpen 
              ? 'bg-gray-800 rotate-90' 
              : 'bg-gradient-to-br from-black via-gray-800 to-black hover:scale-110 animate-pulse-slow'
          }`}
          style={{ 
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
          }}
          aria-label="Otwórz czat"
        >
          {/* Pulse rings */}
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-black/30 animate-ping" style={{ animationDuration: '2s' }} />
              <span className="absolute inset-[-4px] rounded-full border-2 border-black/20 animate-pulse" />
            </>
          )}
          
          {isOpen ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-8 h-8 text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
