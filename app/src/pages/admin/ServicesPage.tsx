import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scissors, Plus, Pencil, Trash2, Search, Clock } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'haircut' | 'beard' | 'combo' | 'coloring' | 'other';
  is_active: boolean;
}

const categories = [
  { value: 'haircut', label: 'Strzyżenie' },
  { value: 'beard', label: 'Broda' },
  { value: 'combo', label: 'Pakiet' },
  { value: 'coloring', label: 'Koloryzacja' },
  { value: 'other', label: 'Inne' },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: 'haircut' as 'haircut' | 'beard' | 'combo' | 'coloring' | 'other',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/v1/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Błąd pobierania usług:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.duration) return;
    
    setIsLoading(true);
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price) * 100, // w groszach
      duration: parseInt(formData.duration),
      category: formData.category,
    };

    try {
      const url = editingService 
        ? `/api/v1/services/${editingService.id}`
        : '/api/v1/services';
      
      const response = await fetch(url, {
        method: editingService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        setIsDialogOpen(false);
        fetchServices();
      } else {
        const error = await response.json();
        alert(error.detail || 'Błąd zapisywania usługi');
      }
    } catch (error) {
      console.error('Błąd:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: (service.price / 100).toString(),
      duration: service.duration.toString(),
      category: service.category,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę usługę?')) return;
    
    try {
      const response = await fetch(`/api/v1/services/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Błąd usuwania:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: 'haircut',
    });
    setEditingService(null);
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => `${(price / 100).toFixed(2)} zł`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usługi</h1>
          <p className="text-gray-500 mt-1">
            Zarządzaj ofertą salonu
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj usługę
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edytuj usługę' : 'Dodaj nową usługę'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Nazwa usługi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="np. Strzyżenie męskie"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Opis usługi..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Cena (zł) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="np. 50"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Czas (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="np. 30"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category">Kategoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !formData.name || !formData.price || !formData.duration}
                className="w-full"
              >
                {isLoading ? 'Zapisywanie...' : (editingService ? 'Zapisz zmiany' : 'Dodaj usługę')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Lista usług ({services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Szukaj usługi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Czas</TableHead>
                <TableHead className="w-24">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    Brak usług
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {service.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {categories.find(c => c.value === service.category)?.label || service.category}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <span className="text-xs font-medium">zł</span>
                        {formatPrice(service.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.duration} min
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </CardContent>
      </Card>
    </div>
  );
}
