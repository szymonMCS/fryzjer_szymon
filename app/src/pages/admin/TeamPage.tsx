import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Pencil, Trash2, Search, Star } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialties: string[];
  image_url: string | null;
  is_active: boolean;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    specialties: '',
    image_url: '',
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/v1/team');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Błąd pobierania zespołu:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedFile) return formData.image_url || null;
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedFile);
    
    try {
      const response = await fetch('/api/v1/admin/uploads/team-member-photo', {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const error = await response.json();
        alert(error.detail || 'Błąd uploadu zdjęcia');
        return null;
      }
    } catch (error) {
      console.error('Błąd uploadu:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.role) return;
    
    setIsLoading(true);
    
    // Upload zdjęcia jeśli wybrano
    const imageUrl = await uploadPhoto();
    
    const payload = {
      name: formData.name,
      role: formData.role,
      bio: formData.bio,
      image_url: imageUrl,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
      is_active: formData.is_active,
    };

    try {
      const url = editingMember 
        ? `/api/v1/team/${editingMember.id}`
        : '/api/v1/team';
      
      const response = await fetch(url, {
        method: editingMember ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        setIsDialogOpen(false);
        fetchMembers();
      } else {
        const error = await response.json();
        alert(error.detail || 'Błąd zapisywania członka zespołu');
      }
    } catch (error) {
      console.error('Błąd:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || '',
      specialties: member.specialties?.join(', ') || '',
      image_url: member.image_url || '',
      is_active: member.is_active,
    });
    setPreviewUrl(member.image_url || '');
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego członka zespołu?')) return;
    
    try {
      const response = await fetch(`/api/v1/team/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Błąd usuwania:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      bio: '',
      specialties: '',
      image_url: '',
      is_active: true,
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setEditingMember(null);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Zespół</h1>
          <p className="text-gray-500 mt-1">
            Zarządzaj pracownikami salonu
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj członka
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edytuj członka zespołu' : 'Dodaj nowego członka'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Imię i nazwisko *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="np. Jan Kowalski"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Stanowisko *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="np. Mistrz Fryzjerstwa"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Krótki opis doświadczenia..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="photo">Zdjęcie</Label>
                <div className="space-y-2">
                  {(previewUrl || formData.image_url) && (
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                      <img 
                        src={previewUrl || formData.image_url} 
                        alt="Podgląd" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="specialties">Specjalności (oddzielone przecinkami)</Label>
                <Input
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                  placeholder="np. Strzyżenie męskie, Koloryzacja, Broda"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, is_active: checked as boolean})
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Aktywny pracownik
                </Label>
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !formData.name || !formData.role}
                className="w-full"
              >
                {isLoading ? 'Zapisywanie...' : (editingMember ? 'Zapisz zmiany' : 'Dodaj członka')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista pracowników ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Szukaj pracownika..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Zdjęcie</TableHead>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead>Stanowisko</TableHead>
                <TableHead>Specjalności</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    Brak pracowników
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        {member.image_url ? (
                          <img 
                            src={member.image_url} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{member.name}</div>
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties?.slice(0, 3).map((spec, i) => (
                          <span 
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs"
                          >
                            <Star className="h-3 w-3" />
                            {spec}
                          </span>
                        ))}
                        {member.specialties && member.specialties.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{member.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        member.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
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
