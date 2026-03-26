import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, Clock, UserX, UserCheck, CalendarDays } from 'lucide-react';
import { api, type TeamMember, type MemberWorkingHours } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ScheduleFormData {
  team_member_id: string;
  work_date: Date;
  is_working: boolean;
  start_time: string;
  end_time: string;
  reason: string;
}

export default function MemberSchedulePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [exceptions, setExceptions] = useState<MemberWorkingHours[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('all');
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    team_member_id: '',
    work_date: new Date(),
    is_working: false,
    start_time: '09:00',
    end_time: '17:00',
    reason: '',
  });

  useEffect(() => {
    fetchMembers();
    fetchExceptions();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await api.team.getAll();
      setMembers(data.filter(m => m.is_active));
    } catch (error) {
      console.error('Błąd pobierania pracowników:', error);
    }
  };

  const fetchExceptions = async () => {
    setIsLoading(true);
    try {
      // Pobierz wszystkie wyjątki z ostatnich 30 dni i następnych 90 dni
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 90);
      
      const data = await api.memberWorkingHours.getByDateRange(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setExceptions(data.sort((a, b) => new Date(b.work_date).getTime() - new Date(a.work_date).getTime()));
    } catch (error) {
      console.error('Błąd pobierania wyjątków:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.memberWorkingHours.create({
        team_member_id: formData.team_member_id,
        work_date: format(formData.work_date, 'yyyy-MM-dd'),
        is_working: formData.is_working,
        start_time: formData.is_working ? formData.start_time : null,
        end_time: formData.is_working ? formData.end_time : null,
        reason: formData.reason || null,
      });
      
      setIsDialogOpen(false);
      resetForm();
      await fetchExceptions();
    } catch (error) {
      console.error('Błąd zapisywania:', error);
      alert('Nie udało się zapisać zmiany grafiku');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wyjątek?')) return;
    
    setIsLoading(true);
    try {
      await api.memberWorkingHours.delete(id);
      await fetchExceptions();
    } catch (error) {
      console.error('Błąd usuwania:', error);
      alert('Nie udało się usunąć wyjątku');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      team_member_id: '',
      work_date: new Date(),
      is_working: false,
      start_time: '09:00',
      end_time: '17:00',
      reason: '',
    });
  };

  const getMemberName = (id: string) => {
    const member = members.find(m => m.id === id);
    return member?.name || 'Nieznany pracownik';
  };

  const filteredExceptions = selectedMember === 'all' 
    ? exceptions 
    : exceptions.filter(e => e.team_member_id === selectedMember);

  const getExceptionTypeLabel = (exc: MemberWorkingHours) => {
    if (exc.is_working) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600">
          <UserCheck className="h-4 w-4" />
          Zmienione godziny
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <UserX className="h-4 w-4" />
        Wolne
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grafik pracowników</h1>
          <p className="text-gray-500">Zarządzaj urlopami i wyjątkami w grafiku</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj wyjątek
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dodaj wyjątek w grafiku</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Pracownik *</Label>
                <Select
                  value={formData.team_member_id}
                  onValueChange={(value) => setFormData({ ...formData, team_member_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz pracownika" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.work_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.work_date ? (
                        format(formData.work_date, "dd MMMM yyyy", { locale: pl })
                      ) : (
                        <span>Wybierz datę</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 min-w-[380px]" side="right" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.work_date}
                      onSelect={(date) => date && setFormData({ ...formData, work_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_working"
                  checked={formData.is_working}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_working: checked as boolean })
                  }
                />
                <Label htmlFor="is_working" className="cursor-pointer">
                  Pracuje (inne godziny)
                </Label>
              </div>

              {formData.is_working && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Od godziny</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required={formData.is_working}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Do godziny</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required={formData.is_working}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Powód / notatka</Label>
                <Textarea
                  placeholder={formData.is_working ? "np. Skrócony dzień" : "np. Urlop wypoczynkowy"}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800"
                disabled={isLoading || !formData.team_member_id}
              >
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <CalendarDays className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">Filtruj pracownika:</span>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Wszyscy pracownicy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy pracownicy</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista wyjątków ({filteredExceptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            </div>
          ) : filteredExceptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Brak wyjątków w grafiku</p>
              <p className="text-sm">Dodaj urlop lub zmianę godzin używając przycisku powyżej</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pracownik</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Szczegóły</TableHead>
                  <TableHead>Powód</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExceptions.map((exc) => (
                  <TableRow key={exc.id}>
                    <TableCell className="font-medium">
                      {getMemberName(exc.team_member_id)}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(exc.work_date), 'dd MMM yyyy', { locale: pl })}
                    </TableCell>
                    <TableCell>{getExceptionTypeLabel(exc)}</TableCell>
                    <TableCell>
                      {exc.is_working && exc.start_time && exc.end_time ? (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Clock className="h-3 w-3" />
                          {exc.start_time.slice(0, 5)} - {exc.end_time.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {exc.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(exc.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-red-600" />
          <span>Urlop / Wolne</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-600" />
          <span>Zmienione godziny pracy</span>
        </div>
      </div>
    </div>
  );
}
