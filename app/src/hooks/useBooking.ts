import { useState, useCallback } from 'react';
import type { BookingFormData, TimeSlot } from '@/types';
import { services } from '@/data/services';
import { teamMembers } from '@/data/team';

// Generate available time slots for a given date
const generateTimeSlots = (date: Date, _serviceDuration: number): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 9; // 9:00 AM
  const endHour = 18; // 6:00 PM
  const interval = 30; // 30 minutes intervals

  // Check if it's Sunday (closed)
  if (date.getDay() === 0) {
    return slots;
  }

  // Check if it's Saturday (shorter hours)
  const isSaturday = date.getDay() === 6;
  const actualEndHour = isSaturday ? 14 : endHour;

  for (let hour = startHour; hour < actualEndHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Simulate some slots being unavailable (randomly)
      const isAvailable = Math.random() > 0.3;
      
      slots.push({
        time: timeString,
        available: isAvailable,
      });
    }
  }

  return slots;
};

// Check if date is in the past
const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Check if date is too far in the future (max 30 days)
const isTooFarDate = (date: Date): boolean => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  return date > maxDate;
};

export const useBooking = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceId: '',
    teamMemberId: '',
    date: null,
    time: '',
    notes: '',
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedService = services.find(s => s.id === formData.serviceId);

  const updateFormData = useCallback((field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  }, []);

  const loadTimeSlots = useCallback((date: Date) => {
    if (!selectedService) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const slots = generateTimeSlots(date, selectedService.duration);
      setTimeSlots(slots);
      setIsLoading(false);
    }, 500);
  }, [selectedService]);

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      setError('Proszę podać imię i nazwisko');
      return false;
    }

    if (!formData.customerEmail.trim()) {
      setError('Proszę podać adres email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      setError('Proszę podać prawidłowy adres email');
      return false;
    }

    if (!formData.customerPhone.trim()) {
      setError('Proszę podać numer telefonu');
      return false;
    }

    const phoneRegex = /^[\d\s\-+()]{9,}$/;
    if (!phoneRegex.test(formData.customerPhone)) {
      setError('Proszę podać prawidłowy numer telefonu');
      return false;
    }

    if (!formData.serviceId) {
      setError('Proszę wybrać usługę');
      return false;
    }

    if (!formData.date) {
      setError('Proszę wybrać datę');
      return false;
    }

    if (isPastDate(formData.date)) {
      setError('Nie można zarezerwować wizyty w przeszłości');
      return false;
    }

    if (isTooFarDate(formData.date)) {
      setError('Można rezerwować maksymalnie 30 dni do przodu');
      return false;
    }

    if (!formData.time) {
      setError('Proszę wybrać godzinę');
      return false;
    }

    return true;
  };

  const submitBooking = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate success
      setSuccess(true);
      setIsLoading(false);
      
      // Reset form after successful booking
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        serviceId: '',
        teamMemberId: '',
        date: null,
        time: '',
        notes: '',
      });
      setTimeSlots([]);

      return true;
    } catch (err) {
      setError('Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.');
      setIsLoading(false);
      return false;
    }
  }, [formData]);

  const getTotalPrice = (): number => {
    return selectedService?.price || 0;
  };

  const getTotalDuration = (): number => {
    return selectedService?.duration || 0;
  };

  return {
    formData,
    updateFormData,
    timeSlots,
    loadTimeSlots,
    isLoading,
    error,
    success,
    submitBooking,
    selectedService,
    selectedTeamMember: teamMembers.find(m => m.id === formData.teamMemberId),
    services,
    teamMembers,
    getTotalPrice,
    getTotalDuration,
  };
};
