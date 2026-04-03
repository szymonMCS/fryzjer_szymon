import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Edit,
  Trash2,
  Brain,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getKnowledgeFiles,
  getKnowledgeFile,
  updateKnowledgeFile,
  deleteKnowledgeFile,
  uploadKnowledgeFile,
  ingestKnowledgeFile,
  syncKnowledgeFiles,
  getRAGHealth,
  getSyncStatus,
  type KnowledgeFile,
} from '@/services/ragApi';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pl-PL');
  } catch {
    return iso;
  }
}

export function KnowledgeBasePage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [ragHealth, setRagHealth] = useState<{
    status: string;
    total_chunks: number;
    chunks_with_embeddings: number;
    categories: string[];
    openai_api_configured: boolean;
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    last_sync: string | null;
    pending_changes: number;
    total_chunks: number;
    is_syncing: boolean;
  } | null>(null);

  // Upload dialog
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<KnowledgeFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingFile, setDeletingFile] = useState<KnowledgeFile | null>(null);

  // Ingest / sync state
  const [ingestingFile, setIngestingFile] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesData, healthData, syncData] = await Promise.all([
        getKnowledgeFiles(),
        getRAGHealth(),
        getSyncStatus(),
      ]);
      setFiles(filesData.items);
      setRagHealth(healthData);
      setSyncStatus(syncData);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      setIsUploading(true);
      const result = await uploadKnowledgeFile(uploadFile);
      toast.success(result.message);
      setIsUploadOpen(false);
      setUploadFile(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas wgrywania pliku');
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = async (file: KnowledgeFile) => {
    try {
      const data = await getKnowledgeFile(file.name);
      setEditingFile(file);
      setFileContent(data.content);
      setIsEditOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas pobierania pliku');
    }
  };

  const handleSave = async () => {
    if (!editingFile) return;
    try {
      setIsSaving(true);
      await updateKnowledgeFile(editingFile.name, fileContent);
      toast.success('Plik zapisany pomyślnie');
      setIsEditOpen(false);
      setEditingFile(null);
      setFileContent('');
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas zapisywania pliku');
    } finally {
      setIsSaving(false);
    }
  };

  const openDelete = (file: KnowledgeFile) => {
    setDeletingFile(file);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFile) return;
    try {
      await deleteKnowledgeFile(deletingFile.name);
      toast.success('Plik usunięty pomyślnie');
      setIsDeleteOpen(false);
      setDeletingFile(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas usuwania pliku');
    }
  };

  const handleIngest = async (file: KnowledgeFile) => {
    setIngestingFile(file.name);
    try {
      const result = await ingestKnowledgeFile(file.name);
      toast.success(result.message);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas przetwarzania pliku');
    } finally {
      setIngestingFile(null);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncKnowledgeFiles();
      toast.success(result.message);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas synchronizacji');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Baza Wiedzy RAG</h1>
          <p className="text-muted-foreground">
            Zarządzaj plikami wiedzy chatbota w formacie Markdown
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RotateCcw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronizacja...' : 'Zsynchronizuj'}
          </Button>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Wgraj plik
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plików wiedzy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chunków w bazie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {ragHealth?.total_chunks || 0}
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

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pliki wiedzy ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(file.size)} • Zmodyfikowano: {formatDate(file.modified_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleIngest(file)}
                        disabled={ingestingFile === file.name || isSyncing}
                        title="Przetwórz plik (ingest)"
                      >
                        {ingestingFile === file.name ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(file)}
                        title="Edytuj plik"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(file)}
                        title="Usuń plik"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {files.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Brak plików w katalogu data. Wgraj pierwszy plik Markdown.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Wgraj plik wiedzy</DialogTitle>
            <DialogDescription>
              Wgraj plik Markdown (.md) lub tekstowy (.txt) do katalogu data.
              Później możesz go przetworzyć przyciskiem 🧠 obok pliku.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Wybierz plik</label>
              <Input
                type="file"
                accept=".md,.txt"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Wybrany plik: {uploadFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadOpen(false);
                setUploadFile(null);
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wgrywanie...
                </>
              ) : (
                'Wgraj plik'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edytuj plik: {editingFile?.name}</DialogTitle>
            <DialogDescription>
              Po zapisaniu zmian pamiętaj, aby przetworzyć plik przyciskiem 🧠 lub
              zsynchronizować wszystkie pliki.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Treść pliku Markdown..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz zmiany
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć plik "{deletingFile?.name}"? Usunięcie pliku
              spowoduje również usunięcie powiązanych z nim chunków z bazy wiedzy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
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
