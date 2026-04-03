import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import type { BookingFormData, TimeSlot, Service, TeamMember } from '@/types';
import type { Booking, BookingUpdate } from '@/lib/api.types';
import { api } from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

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

  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingFormData | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string>('');

  // Load services and team from API on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [servicesData, teamData] = await Promise.all([
          api.services.getAll(),
          api.team.getAll(),
        ]);
        // Filter active and convert price from cents to zloty
        const activeServices = servicesData
          .filter(s => s.is_active !== false)
          .map(s => ({
            ...s,
            price: s.price / 100, // Convert from cents to zloty
          }));
        setServices(activeServices);
        setTeamMembers(teamData.filter(m => m.is_active !== false));
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadInitialData();
  }, []);

  const selectedService = services.find(s => s.id === formData.serviceId);

  const updateFormData = useCallback((field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  }, []);

  // Load available time slots from API
  const loadTimeSlots = useCallback(async (date: Date) => {
    if (!selectedService || !formData.serviceId) return;

    setIsLoadingSlots(true);
    setTimeSlots([]);
    setFormData(prev => ({ ...prev, time: '' }));

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const teamMemberId = formData.teamMemberId || undefined;

      const response = await api.bookings.getAvailability(
        dateStr,
        formData.serviceId,
        teamMemberId
      );

      // Convert API slots to TimeSlot format
      const slots: TimeSlot[] = response.slots.map(slot => ({
        time: slot.time,
        available: slot.available_team_members.length > 0,
      }));

      setTimeSlots(slots);
    } catch (err) {
      console.error('Failed to load time slots:', err);
      setTimeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedService, formData.serviceId, formData.teamMemberId]);

  // Reload time slots when team member changes (if date is already selected)
  useEffect(() => {
    if (formData.date && selectedService) {
      loadTimeSlots(formData.date);
    }
  }, [formData.teamMemberId]);

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
      const response = await api.bookings.create({
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        service_id: formData.serviceId,
        team_member_id: formData.teamMemberId && formData.teamMemberId.trim() !== ''
          ? formData.teamMemberId
          : null,
        booking_date: format(formData.date!, 'yyyy-MM-dd'),
        booking_time: formData.time,
        notes: formData.notes && formData.notes.trim() !== '' ? formData.notes : null,
      });

      // Save confirmed booking data
      setConfirmedBooking({ ...formData });
      setConfirmationCode(response.confirmation_code);

      // Success
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
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas rezerwacji. Spróbuj ponownie.');
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

  const confirmedService = services.find(s => s.id === confirmedBooking?.serviceId);
  const confirmedTeamMember = teamMembers.find(m => m.id === confirmedBooking?.teamMemberId);

  const getConfirmedTotalPrice = (): number => {
    return confirmedService?.price || 0;
  };

  const getConfirmedTotalDuration = (): number => {
    return confirmedService?.duration || 0;
  };

  const selectedTeamMember = teamMembers.find(m => m.id === formData.teamMemberId);

  return {
    formData,
    updateFormData,
    timeSlots,
    loadTimeSlots,
    isLoading,
    isLoadingSlots,
    error,
    success,
    submitBooking,
    selectedService,
    selectedTeamMember,
    services,
    teamMembers,
    getTotalPrice,
    getTotalDuration,
    // Confirmed booking data for success screen
    confirmedBooking,
    confirmedService,
    confirmedTeamMember,
    confirmationCode,
    getConfirmedTotalPrice,
    getConfirmedTotalDuration,
  };
};


// ==================== ADMIN BOOKINGS ====================

interface UseBookingsState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

interface UseBookingsReturn extends UseBookingsState {
  refetch: () => Promise<void>;
  updateBooking: (id: string, data: BookingUpdate) => Promise<Booking | null>;
  cancelBooking: (id: string, confirmationCode: string) => Promise<boolean>;
}

export const useBookings = (): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/bookings/admin/bookings`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać rezerwacji';
      setError(errorMessage);
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBooking = useCallback(async (id: string, data: BookingUpdate): Promise<Booking | null> => {
    try {
      const response = await fetch(`${API_URL}/bookings/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }

      const updatedBooking = await response.json();
      setBookings(prev => prev.map(b => b.id === id ? updatedBooking : b));
      return updatedBooking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się zaktualizować rezerwacji';
      setError(errorMessage);
      console.error('Error updating booking:', err);
      return null;
    }
  }, []);

  const cancelBooking = useCallback(async (id: string, confirmationCode: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ confirmation_code: confirmationCode }),
      });

      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }

      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się anulować rezerwacji';
      setError(errorMessage);
      console.error('Error cancelling booking:', err);
      return false;
    }
  }, []);

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings,
    updateBooking,
    cancelBooking,
  };
};

export default useBookings;
