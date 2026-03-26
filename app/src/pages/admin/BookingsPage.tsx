import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Phone, Mail, User, Search, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  service_id: string;
  service_name: string;
  team_member_id: string | null;
  team_member_name: string | null;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes: string | null;
  confirmation_code: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Oczekująca', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Potwierdzona', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Anulowana', color: 'bg-red-100 text-red-700 border-red-200' },
  completed: { label: 'Zrealizowana', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  no_show: { label: 'Nieobecność', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter) {
        params.append('start_date', dateFilter);
        params.append('end_date', dateFilter);
      }
      
      const response = await fetch(`/api/v1/bookings/admin/bookings?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Błąd pobierania rezerwacji:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/v1/bookings/admin/bookings/${id}?status=${status}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        fetchBookings();
      } else {
        const error = await response.json();
        alert(error.detail || 'Błąd aktualizacji statusu');
      }
    } catch (error) {
      console.error('Błąd:', error);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę rezerwację?')) return;
    
    try {
      const response = await fetch(`/api/v1/bookings/admin/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Błąd usuwania:', error);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone.includes(searchQuery) ||
      b.confirmation_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: pl });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rezerwacje</h1>
          <p className="text-gray-500 mt-1">
            Zarządzaj rezerwacjami klientów
          </p>
        </div>
        
        <Button onClick={fetchBookings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Odśwież
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lista rezerwacji ({bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Szukaj: imię, telefon, kod, usługa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Wszystkie statusy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie statusy</SelectItem>
                  <SelectItem value="pending">Oczekujące</SelectItem>
                  <SelectItem value="confirmed">Potwierdzone</SelectItem>
                  <SelectItem value="completed">Zrealizowane</SelectItem>
                  <SelectItem value="cancelled">Anulowane</SelectItem>
                  <SelectItem value="no_show">Nieobecności</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead>Usługa / Data</TableHead>
                  <TableHead>Fryzjer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead className="w-32">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Brak rezerwacji
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {booking.customer_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.customer_phone}
                          </div>
                          {booking.customer_email && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {booking.customer_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{booking.service_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(booking.booking_date)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.booking_time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.team_member_name || 'Dowolny'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusLabels[booking.status]?.color}
                        >
                          {statusLabels[booking.status]?.label}
                        </Badge>
                        {booking.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            "{booking.notes}"
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {booking.confirmation_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {booking.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => updateStatus(booking.id, 'completed')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            onClick={() => deleteBooking(booking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
