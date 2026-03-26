import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ban, Trash2, Plus, Search, Phone, Mail } from 'lucide-react';

interface BlacklistedEntry {
  id: string;
  phone_number: string | null;
  email: string | null;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('phone');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/v1/admin/blacklist/phones', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Błąd pobierania czarnej listy:', error);
    }
  };

  const addEntry = async () => {
    const isPhoneMode = activeTab === 'phone';
    const value = isPhoneMode ? newPhone : newEmail;
    
    if (!value) return;
    
    setIsLoading(true);
    try {
      const body = isPhoneMode 
        ? { phone_number: newPhone, reason: newReason || null }
        : { email: newEmail, reason: newReason || null };
      
      const response = await fetch('/api/v1/admin/blacklist/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setNewPhone('');
        setNewEmail('');
        setNewReason('');
        setIsDialogOpen(false);
        fetchEntries();
      } else {
        const error = await response.json();
        alert(error.detail || 'Błąd dodawania wpisu');
      }
    } catch (error) {
      console.error('Błąd:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis z czarnej listy?')) return;
    
    try {
      const response = await fetch(`/api/v1/admin/blacklist/phones/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error('Błąd usuwania:', error);
    }
  };

  const filteredEntries = entries.filter(e => {
    const query = searchQuery.toLowerCase();
    const phoneMatch = e.phone_number?.toLowerCase().includes(query);
    const emailMatch = e.email?.toLowerCase().includes(query);
    const reasonMatch = e.reason?.toLowerCase().includes(query);
    return phoneMatch || emailMatch || reasonMatch;
  });

  const getEntryDisplay = (entry: BlacklistedEntry) => {
    if (entry.phone_number) {
      return (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="font-mono font-medium">{entry.phone_number}</span>
        </div>
      );
    }
    if (entry.email) {
      return (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span>{entry.email}</span>
        </div>
      );
    }
    return <span className="text-gray-400">-</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Czarna lista</h1>
          <p className="text-gray-500 mt-1">
            Zarządzaj zablokowanymi numerami telefonów i emailami
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj do listy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj do czarnej listy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="phone">
                    <Phone className="h-4 w-4 mr-2" />
                    Telefon
                  </TabsTrigger>
                  <TabsTrigger value="email">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="phone" className="pt-4">
                  <div>
                    <Label htmlFor="phone">Numer telefonu (9 cyfr)</Label>
                    <Input
                      id="phone"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="np. 123456789"
                      maxLength={9}
                    />
                    <p className="text-xs text-gray-500 mt-1">Podaj dokładnie 9 cyfr (bez kierunkowego +48)</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="email" className="pt-4">
                  <div>
                    <Label htmlFor="email">Adres email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="np. spam@example.com"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div>
                <Label htmlFor="reason">Powód (opcjonalnie)</Label>
                <Textarea
                  id="reason"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="np. Nie stawił się na wizycie, nie odebrał telefonu..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={addEntry} 
                disabled={isLoading || (activeTab === 'phone' ? !newPhone : !newEmail)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Dodawanie...' : 'Dodaj do czarnej listy'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Zablokowane wpisy ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Szukaj numeru, emaila lub powodu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wartość</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Powód</TableHead>
                <TableHead>Data dodania</TableHead>
                <TableHead className="w-24">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    {searchQuery 
                      ? 'Nie znaleziono wpisów' 
                      : 'Brak zablokowanych wpisów'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {getEntryDisplay(entry)}
                    </TableCell>
                    <TableCell>
                      {entry.phone_number ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          Telefon
                        </span>
                      ) : entry.email ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          Email
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {entry.reason || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString('pl-PL')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(entry.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-medium">ℹ️ Informacja</p>
        <p className="mt-1">
          Numery telefonów i adresy email na czarnej liście nie mogą dokonywać rezerwacji przez system. 
          Klient zobaczy komunikat o zablokowaniu i będzie musiał skontaktować się bezpośrednio z salonem.
        </p>
      </div>
    </div>
  );
}
