import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Search,
  RefreshCw,
  Database,
  FileText,
  Tag,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getKnowledgeChunks,
  getKnowledgeChunk,
  createKnowledgeChunk,
  updateKnowledgeChunk,
  deleteKnowledgeChunk,
  regenerateEmbedding,
  getCategories,
  getSyncStatus,
  getRAGHealth,
  type KnowledgeChunk,
} from '@/services/ragApi';

const ITEMS_PER_PAGE = 20;

const CATEGORY_LABELS: Record<string, string> = {
  services: 'Usługi',
  team: 'Zespół',
  hours: 'Godziny',
  booking: 'Rezerwacje',
  contact: 'Kontakt',
  faq: 'FAQ',
  haircare: 'Wiedza fryzjerska',
  salon_info: 'O salonie',
  general: 'Ogólne',
};

const CATEGORY_COLORS: Record<string, string> = {
  services: 'bg-blue-100 text-blue-800',
  team: 'bg-green-100 text-green-800',
  hours: 'bg-yellow-100 text-yellow-800',
  booking: 'bg-purple-100 text-purple-800',
  contact: 'bg-pink-100 text-pink-800',
  faq: 'bg-orange-100 text-orange-800',
  haircare: 'bg-teal-100 text-teal-800',
  salon_info: 'bg-indigo-100 text-indigo-800',
  general: 'bg-gray-100 text-gray-800',
};

export function KnowledgeBasePage() {
  const { token } = useAuth();

  // State
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    last_sync: string | null;
    pending_changes: number;
    total_chunks: number;
    is_syncing: boolean;
  } | null>(null);
  const [ragHealth, setRagHealth] = useState<{
    status: string;
    total_chunks: number;
    chunks_with_embeddings: number;
    categories: string[];
    openai_api_configured: boolean;
  } | null>(null);

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRebuildDialogOpen, setIsRebuildDialogOpen] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<KnowledgeChunk | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: 'general',
    title: '',
    content: '',
    source: '',
  });

  // Load data
  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [chunksData, categoriesData, syncData, healthData] = await Promise.all([
        getKnowledgeChunks(
          token,
          page,
          ITEMS_PER_PAGE,
          selectedCategory === 'all' ? undefined : selectedCategory,
          searchQuery || undefined
        ),
        getCategories(token),
        getSyncStatus(token),
        getRAGHealth(),
      ]);

      setChunks(chunksData.items);
      setTotalPages(chunksData.pages);
      setCategories(categoriesData.categories);
      setSyncStatus(syncData);
      setRagHealth(healthData);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, page, selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = async () => {
    if (!token) return;

    try {
      await createKnowledgeChunk(token, formData);
      toast.success('Chunk utworzony pomyślnie');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas tworzenia chunka');
    }
  };

  const handleUpdate = async () => {
    if (!token || !selectedChunk) return;

    try {
      await updateKnowledgeChunk(token, selectedChunk.id, formData, true);
      toast.success('Chunk zaktualizowany pomyślnie');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas aktualizacji chunka');
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedChunk) return;

    try {
      await deleteKnowledgeChunk(token, selectedChunk.id);
      toast.success('Chunk usunięty pomyślnie');
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas usuwania chunka');
    }
  };

  const handleRegenerateEmbedding = async (chunkId: string) => {
    if (!token) return;

    try {
      setIsRegenerating(true);
      await regenerateEmbedding(token, chunkId);
      toast.success('Embedding zregenerowany pomyślnie');
      loadData();
    } catch (error) {
      toast.error('Błąd podczas regenerowania embeddingu');
    } finally {
      setIsRegenerating(false);
    }
  };

  const openCreateDialog = () => {
    setIsCreating(true);
    setSelectedChunk(null);
    setFormData({
      category: 'general',
      title: '',
      content: '',
      source: '',
    });
    setIsEditDialogOpen(true);
  };

  const openEditDialog = async (chunk: KnowledgeChunk) => {
    if (!token) return;

    try {
      const fullChunk = await getKnowledgeChunk(token, chunk.id);
      setIsCreating(false);
      setSelectedChunk(fullChunk);
      setFormData({
        category: fullChunk.category,
        title: fullChunk.title,
        content: fullChunk.content,
        source: fullChunk.source || '',
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      toast.error('Błąd podczas pobierania szczegółów');
    }
  };

  const openDeleteDialog = (chunk: KnowledgeChunk) => {
    setSelectedChunk(chunk);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Baza Wiedzy RAG</h1>
          <p className="text-muted-foreground">
            Zarządzaj wiedzą chatbota i embeddingami
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nowy chunk
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wszystkich chunków
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ragHealth?.total_chunks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Z embeddingami
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {ragHealth?.chunks_with_embeddings || 0}
              {ragHealth && ragHealth.chunks_with_embeddings === ragHealth.total_chunks && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API OpenAI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {ragHealth?.openai_api_configured ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Skonfigurowane</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm">Brak klucza</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oczekujących zmian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.pending_changes || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Szukaj w bazie wiedzy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Wszystkie kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chunks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Chunki wiedzy ({chunks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          CATEGORY_COLORS[chunk.category] ||
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {CATEGORY_LABELS[chunk.category] || chunk.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {chunk.source}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRegenerateEmbedding(chunk.id)}
                        disabled={isRegenerating}
                        title="Regeneruj embedding"
                      >
                        <Brain className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(chunk)}
                        title="Edytuj"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(chunk)}
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-medium mb-1">{chunk.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {chunk.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {chunk.has_embedding ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                      )}
                      {chunk.has_embedding ? 'Embedding OK' : 'Brak embeddingu'}
                    </span>
                    <span>Zaktualizowano: {formatDate(chunk.updated_at)}</span>
                  </div>
                </div>
              ))}

              {chunks.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Brak chunków do wyświetlenia
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Poprzednia
              </Button>
              <span className="flex items-center px-4">
                Strona {page} z {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Następna
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Nowy chunk wiedzy' : 'Edytuj chunk'}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Dodaj nowy fragment wiedzy do bazy RAG'
                : 'Edytuj istniejący fragment wiedzy'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Kategoria</label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tytuł</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Tytuł chunka"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Treść</label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Treść wiedzy..."
                rows={8}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Źródło (opcjonalne)</label>
              <Input
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                placeholder="np. baza_wiedzy_salonu.md"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={isCreating ? handleCreate : handleUpdate}>
              {isCreating ? 'Utwórz' : 'Zapisz zmiany'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć chunk "{selectedChunk?.title}"? Tej
              operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KnowledgeBasePage;
