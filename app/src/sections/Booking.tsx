import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useBooking } from '@/hooks/useBooking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Clock, Calendar, User, Scissors, Check, Loader2 } from 'lucide-react';

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

export const Booking = () => {
  const {
    formData,
    updateFormData,
    timeSlots,
    loadTimeSlots,
    isLoading,
    error,
    success,
    submitBooking,
    selectedService,
    services,
    teamMembers,
    getTotalPrice,
    getTotalDuration,
  } = useBooking();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days
  const getCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add padding days for the start of the month
    const startDay = getDay(start);
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    const padding = Array(paddingDays).fill(null);

    return [...padding, ...days];
  };

  const handleDateSelect = (date: Date) => {
    if (isPast(date) && !isToday(date)) return;
    updateFormData('date', date);
    loadTimeSlots(date);
    updateFormData('time', ''); // Reset time when date changes
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleSubmit = async () => {
    await submitBooking();
  };

  return (
    <section id="booking" className="section py-24 bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 reveal-up">
            Rezerwacja
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 reveal-up">
            Umów się na wizytę
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto reveal-up">
            Wybierz usługę, datę i godzinę. Zarezerwuj wizytę w kilka prostych
            kroków.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Form */}
          <div className="space-y-8">
            {/* Personal Info */}
            <div className="bg-[#F9F9F9] rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Twoje dane
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Imię i nazwisko *</Label>
                  <Input
                    id="name"
                    value={formData.customerName}
                    onChange={(e) => updateFormData('customerName', e.target.value)}
                    placeholder="Jan Kowalski"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => updateFormData('customerEmail', e.target.value)}
                    placeholder="jan@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => updateFormData('customerPhone', e.target.value)}
                    placeholder="+48 123 456 789"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Service Selection */}
            <div className="bg-[#F9F9F9] rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Scissors className="w-5 h-5 mr-2" />
                Wybierz usługę
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Usługa *</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(value) => updateFormData('serviceId', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Wybierz usługę" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {service.price} PLN
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fryzjer (opcjonalnie)</Label>
                  <Select
                    value={formData.teamMemberId || 'any'}
                    onValueChange={(value) => updateFormData('teamMemberId', value === 'any' ? '' : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Dowolny fryzjer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Dowolny fryzjer</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-[#F9F9F9] rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Uwagi (opcjonalnie)</h3>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Dodatkowe informacje dla fryzjera..."
                rows={3}
              />
            </div>
          </div>

          {/* Right Column - Calendar & Time */}
          <div className="space-y-8">
            {/* Calendar */}
            <div className="bg-[#F9F9F9] rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Wybierz datę
              </h3>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: pl })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isSelected = formData.date && isSameDay(day, formData.date);
                  const isDisabled = (isPast(day) && !isToday(day)) || getDay(day) === 0;
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-sm
                        transition-all duration-200
                        ${isSelected ? 'bg-black text-white' : ''}
                        ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/10'}
                        ${!isCurrentMonth ? 'text-gray-300' : ''}
                        ${isToday(day) && !isSelected ? 'border-2 border-black' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {formData.date && (
              <div className="bg-[#F9F9F9] rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Wybierz godzinę
                </h3>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() =>
                          slot.available && updateFormData('time', slot.time)
                        }
                        disabled={!slot.available}
                        className={`
                          py-3 px-2 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${
                            formData.time === slot.time
                              ? 'bg-black text-white'
                              : slot.available
                              ? 'bg-white hover:bg-black hover:text-white border border-gray-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                          }
                        `}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Brak dostępnych terminów w tym dniu.
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            {selectedService && (
              <div className="bg-black text-white rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Podsumowanie</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-white/70">Usługa:</span>
                    <span>{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Czas trwania:</span>
                    <span>{getTotalDuration()} min</span>
                  </div>
                  {formData.date && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Data:</span>
                      <span>
                        {format(formData.date, 'dd.MM.yyyy', { locale: pl })}
                      </span>
                    </div>
                  )}
                  {formData.time && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Godzina:</span>
                      <span>{formData.time}</span>
                    </div>
                  )}
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Razem:</span>
                      <span>{getTotalPrice()} PLN</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/20 text-green-200 p-3 rounded-lg mb-4 text-sm flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    Rezerwacja potwierdzona! Sprawdź email.
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || success}
                  className="w-full py-6 bg-white text-black hover:bg-white/90 font-medium text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Przetwarzanie...
                    </>
                  ) : success ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Zarezerwowano
                    </>
                  ) : (
                    'Potwierdź rezerwację'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
