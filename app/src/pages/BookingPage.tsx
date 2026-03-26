import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useBooking } from '@/hooks/useBooking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  Scissors, 
  Check, 
  Loader2, 
  ArrowLeft,
  Sparkles,
  Shield,
  Phone,
  User,
  Key
} from 'lucide-react';
import { Link } from 'react-router-dom';

const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

export const BookingPage = () => {
  const {
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
  } = useBooking();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [step, setStep] = useState(1);

  // Generate calendar days
  const getCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    const padding = Array(paddingDays).fill(null);
    return [...padding, ...days];
  };

  const handleDateSelect = (date: Date) => {
    if (isPast(date) && !isToday(date)) return;
    updateFormData('date', date);
    loadTimeSlots(date);
    updateFormData('time', '');
  };

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const handleSubmit = async () => {
    const result = await submitBooking();
    if (result) setStep(4);
  };

  const canProceed = () => {
    if (step === 1) return formData.serviceId;
    if (step === 2) return formData.date && formData.time;
    if (step === 3) return formData.customerName && formData.customerEmail && formData.customerPhone;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-black text-white py-8">
        <div className="container-custom flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Scissors className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold">SZYMON</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <a href="tel:+48123456789" className="flex items-center gap-2 hover:text-gray-300">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">+48 123 456 789</span>
            </a>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b py-2">
        <div className="container-custom py-8">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Usługa' },
              { num: 2, label: 'Termin' },
              { num: 3, label: 'Dane' },
              { num: 4, label: 'Potwierdzenie' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex flex-col items-center ${step >= s.num ? 'text-black' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1 ${
                    step > s.num ? 'bg-black text-white' : 
                    step === s.num ? 'bg-black text-white ring-4 ring-black/10' : 
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
                {i < 3 && (
                  <div className={`w-16 md:w-24 h-1 mx-2 ${step > s.num ? 'bg-black' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-custom py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-500 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Wróć do strony głównej
          </Link>

          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Wybierz usługę</h1>
              <p className="text-gray-600 mb-8">Wybierz usługę, która Cię interesuje</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => updateFormData('serviceId', service.id)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      formData.serviceId === service.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg">{service.name}</h3>
                      <span className={`text-2xl font-bold ${
                        formData.serviceId === service.id ? 'text-white' : 'text-black'
                      }`}>
                        {service.price} PLN
                      </span>
                    </div>
                    <p className={`text-sm mb-4 ${
                      formData.serviceId === service.id ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      {service.description}
                    </p>
                    <div className={`flex items-center text-sm ${
                      formData.serviceId === service.id ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      <Clock className="w-4 h-4 mr-2" />
                      {service.duration} min
                    </div>
                  </button>
                ))}
              </div>

              {/* Team Member Selection */}
              {formData.serviceId && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-xl font-bold mb-4">Wybierz fryzjera (opcjonalnie)</h2>
                  <p className="text-gray-600 mb-4">Wybierz preferowanego fryzjera lub zostaw puste dla dowolnego</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* "Any" option */}
                    <button
                      onClick={() => updateFormData('teamMemberId', '')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        !formData.teamMemberId
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-3 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-gray-500" />
                      </div>
                      <h3 className="font-bold">Dowolny fryzjer</h3>
                      <p className="text-sm opacity-80 mt-1">Najszybszy termin</p>
                    </button>

                    {teamMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => updateFormData('teamMemberId', member.id)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${
                          formData.teamMemberId === member.id
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {member.image || member.image_url ? (
                          <img
                            src={member.image || member.image_url}
                            alt={member.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-gray-600 ${(member.image || member.image_url) ? 'hidden' : ''}`}>
                          {member.name.charAt(0)}
                        </div>
                        <h3 className="font-bold">{member.name}</h3>
                        <p className={`text-sm mt-1 ${
                          formData.teamMemberId === member.id ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {member.role}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-16 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className="px-8 py-6 text-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Dalej
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Wybierz termin</h1>
              <p className="text-gray-600 mb-8">Wybierz dogodną datę i godzinę wizyty</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div className="bg-white rounded-3xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-lg capitalize">
                      {format(currentMonth, 'MMMM yyyy', { locale: pl })}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays().map((day, index) => {
                      if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
                      const isSelected = formData.date && isSameDay(day, formData.date);
                      const isDisabled = (isPast(day) && !isToday(day)) || getDay(day) === 0;
                      const isCurrentMonth = isSameMonth(day, currentMonth);

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => handleDateSelect(day)}
                          disabled={isDisabled}
                          className={`
                            aspect-square flex items-center justify-center rounded-xl text-sm font-medium
                            transition-all duration-200
                            ${isSelected ? 'bg-black text-white scale-110' : ''}
                            ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}
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
                <div>
                  {formData.date && (
                    <div className="bg-white rounded-3xl p-6 shadow-lg">
                      <h3 className="font-bold text-lg mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Dostępne godziny
                        <span className="ml-auto text-sm font-normal text-gray-500">
                          {format(formData.date, 'EEEE, d MMMM', { locale: pl })}
                        </span>
                      </h3>

                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="ml-3 text-gray-500">Ładowanie dostępnych godzin...</span>
                        </div>
                      ) : timeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && updateFormData('time', slot.time)}
                              disabled={!slot.available}
                              className={`
                                py-3 px-2 rounded-xl text-sm font-medium
                                transition-all duration-200
                                ${formData.time === slot.time
                                  ? 'bg-black text-white'
                                  : slot.available
                                  ? 'bg-gray-100 hover:bg-black hover:text-white'
                                  : 'bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                                }
                              `}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          Brak dostępnych terminów w tym dniu.
                        </p>
                      )}
                    </div>
                  )}

                  {!formData.date && (
                    <div className="bg-gray-100 rounded-3xl p-12 text-center">
                      <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Wybierz datę z kalendarza</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-16 flex justify-between">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="px-6 py-5"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Wstecz
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className="px-8 py-6 text-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Dalej
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Personal Data */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Twoje dane</h1>
              <p className="text-gray-600 mb-8">Wprowadź swoje dane kontaktowe</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white rounded-3xl p-8 shadow-lg">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                        Imię i nazwisko *
                      </Label>
                      <Input
                        id="name"
                        value={formData.customerName}
                        onChange={(e) => updateFormData('customerName', e.target.value)}
                        placeholder="Jan Kowalski"
                        className="py-6 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => updateFormData('customerEmail', e.target.value)}
                        placeholder="jan@example.com"
                        className="py-6 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                        Telefon *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => updateFormData('customerPhone', e.target.value)}
                        placeholder="+48 123 456 789"
                        className="py-6 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                        Uwagi (opcjonalnie)
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => updateFormData('notes', e.target.value)}
                        placeholder="Dodatkowe informacje dla fryzjera..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <div className="bg-black text-white rounded-3xl p-8 sticky top-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                      Podsumowanie
                    </h3>
                    
                    {selectedService && (
                      <div className="space-y-4">
                        <div className="flex justify-between py-3 border-b border-white/20">
                          <span className="text-white/70">Usługa</span>
                          <span className="font-medium">{selectedService.name}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-white/20">
                          <span className="text-white/70">Czas trwania</span>
                          <span>{getTotalDuration()} min</span>
                        </div>
                        {formData.date && (
                          <div className="flex justify-between py-3 border-b border-white/20">
                            <span className="text-white/70">Data</span>
                            <span>{format(formData.date, 'd MMMM yyyy', { locale: pl })}</span>
                          </div>
                        )}
                        {formData.time && (
                          <div className="flex justify-between py-3 border-b border-white/20">
                            <span className="text-white/70">Godzina</span>
                            <span>{formData.time}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-3 border-b border-white/20">
                          <span className="text-white/70">Fryzjer</span>
                          <span>
                            {formData.teamMemberId 
                              ? teamMembers.find(m => m.id === formData.teamMemberId)?.name || 'Wybrany fryzjer'
                              : 'Dowolny dostępny'}
                          </span>
                        </div>
                        <div className="pt-4">
                          <div className="flex justify-between text-2xl font-bold">
                            <span>Do zapłaty</span>
                            <span>{getTotalPrice()} PLN</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/20">
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <Shield className="w-5 h-5" />
                        <span>Bezpieczna rezerwacja - płatność w salonie</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl">
                  {error}
                </div>
              )}

              <div className="mt-16 flex justify-between">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="px-6 py-5"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Wstecz
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isLoading}
                  className="px-8 py-6 text-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Przetwarzanie...
                    </>
                  ) : (
                    <>
                      Potwierdź rezerwację
                      <Check className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && success && confirmedBooking && (
            <div className="animate-in fade-in zoom-in duration-500 text-center py-16">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Rezerwacja potwierdzona!</h1>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                Dziękujemy! Twoja wizyta została zarezerwowana. 
                Potwierdzenie zostało wysłane na podany adres email.
              </p>
              
              <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md mx-auto mb-8">
                <h3 className="font-bold mb-4">Szczegóły wizyty:</h3>
                {confirmedService && (
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Usługa:</span>
                      <span className="font-medium ml-auto">{confirmedService.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Fryzjer:</span>
                      <span className="font-medium ml-auto">
                        {confirmedTeamMember?.name || 'Dowolny dostępny'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Data:</span>
                      <span className="font-medium ml-auto">{confirmedBooking.date && format(confirmedBooking.date, 'd MMMM yyyy', { locale: pl })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Godzina:</span>
                      <span className="font-medium ml-auto">{confirmedBooking.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Czas trwania:</span>
                      <span className="font-medium ml-auto">{getConfirmedTotalDuration()} min</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Cena:</span>
                        <span className="text-xl font-bold">{getConfirmedTotalPrice()} PLN</span>
                      </div>
                    </div>
                    <div className="border-t pt-3 mt-3 space-y-2 text-sm">
                      <p><span className="text-gray-500">Imię:</span> {confirmedBooking.customerName}</p>
                      <p><span className="text-gray-500">Email:</span> {confirmedBooking.customerEmail}</p>
                      <p><span className="text-gray-500">Telefon:</span> {confirmedBooking.customerPhone}</p>
                      {confirmedBooking.notes && (
                        <p><span className="text-gray-500">Uwagi:</span> {confirmedBooking.notes}</p>
                      )}
                    </div>
                    {confirmationCode && (
                      <div className="mt-4 bg-black text-white p-4 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Key className="w-4 h-4 opacity-80" />
                          <p className="text-sm opacity-80">Kod potwierdzenia:</p>
                        </div>
                        <p className="text-2xl font-bold tracking-widest">{confirmationCode}</p>
                        <p className="text-xs opacity-60 mt-1">Zachowaj ten kod do anulowania wizyty</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button className="px-8 py-6 bg-black text-white hover:bg-gray-800">
                    Wróć do strony głównej
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="px-8 py-6"
                  onClick={() => window.location.reload()}
                >
                  Zarezerwuj kolejną wizytę
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-12 mt-auto">
        <div className="container-custom text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} Fryzjer Męski Szymon. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
};
