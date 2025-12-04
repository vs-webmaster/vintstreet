import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, AlertTriangle, Eye, EyeOff, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { clearProhibitedWordsCache } from '@/lib/prohibitedWordsValidation';
import {
  fetchAllProhibitedWords,
  createProhibitedWord,
  updateProhibitedWord,
  deleteProhibitedWord,
  bulkCreateProhibitedWords,
} from '@/services/prohibitedWords';
import { isFailure } from '@/types/api';

interface ProhibitedWord {
  id: string;
  word: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ProhibitedWordsTab = () => {
  const [newWord, setNewWord] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showWords, setShowWords] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkWords, setBulkWords] = useState('');
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const queryClient = useQueryClient();

  const { data: words = [], isLoading } = useQuery({
    queryKey: ['prohibited-words'],
    queryFn: async () => {
      const result = await fetchAllProhibitedWords();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  const handleAddWord = async () => {
    if (!newWord.trim()) {
      toast.error('Please enter a word or phrase');
      return;
    }

    setIsAdding(true);
    try {
      const result = await createProhibitedWord(newWord);
      if (isFailure(result)) throw result.error;

      clearProhibitedWordsCache();
      queryClient.invalidateQueries({ queryKey: ['prohibited-words'] });
      toast.success('Prohibited word added successfully');
      setNewWord('');
    } catch (error: any) {
      console.error('Error adding word:', error);
      toast.error(error.message || 'Failed to add prohibited word');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const result = await updateProhibitedWord(id, !currentState);
      if (isFailure(result)) throw result.error;

      clearProhibitedWordsCache();
      queryClient.invalidateQueries({ queryKey: ['prohibited-words'] });
      toast.success(`Word ${!currentState ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      console.error('Error toggling word:', error);
      toast.error('Failed to update word status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const result = await deleteProhibitedWord(deleteId);
      if (isFailure(result)) throw result.error;

      clearProhibitedWordsCache();
      queryClient.invalidateQueries({ queryKey: ['prohibited-words'] });
      toast.success('Prohibited word deleted');
      setDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting word:', error);
      toast.error('Failed to delete prohibited word');
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkWords.trim()) {
      toast.error('Please enter words to add');
      return;
    }

    setIsBulkAdding(true);
    try {
      // Split by newlines, commas, or semicolons and clean up
      const wordsArray = bulkWords
        .split(/[\n,;]+/)
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length > 0);

      if (wordsArray.length === 0) {
        toast.error('No valid words found');
        return;
      }

      // Insert all words at once
      const result = await bulkCreateProhibitedWords(wordsArray);
      if (isFailure(result)) throw result.error;

      clearProhibitedWordsCache();
      queryClient.invalidateQueries({ queryKey: ['prohibited-words'] });
      toast.success(`Successfully added ${wordsArray.length} prohibited word${wordsArray.length > 1 ? 's' : ''}`);
      setBulkWords('');
      setIsBulkDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding bulk words:', error);
      toast.error(error.message || 'Failed to add prohibited words');
    } finally {
      setIsBulkAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Prohibited Words Management
          </CardTitle>
          <CardDescription>
            Manage words and phrases that are not allowed in product names and descriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="new-word">Add Single Word/Phrase</Label>
              <Input
                id="new-word"
                placeholder="Enter word or phrase..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              />
            </div>
            <Button onClick={handleAddWord} disabled={isAdding || !newWord.trim()} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Add Word
            </Button>
            <Button onClick={() => setIsBulkDialogOpen(true)} variant="outline" className="mt-6">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Add
            </Button>
          </div>

          <div className="flex items-center justify-between border-t py-4">
            <div>
              <p className="text-sm font-medium">Total Prohibited Words: {words.length}</p>
              <p className="text-xs text-muted-foreground">
                Active: {words.filter((w) => w.is_active).length} | Inactive: {words.filter((w) => !w.is_active).length}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowWords(!showWords)}>
              {showWords ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Words
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Words
                </>
              )}
            </Button>
          </div>

          {showWords && (
            <div className="rounded-lg border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading prohibited words...</div>
              ) : words.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No prohibited words configured yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Word/Phrase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {words.map((word) => (
                      <TableRow key={word.id}>
                        <TableCell className="font-medium">{word.word}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={word.is_active}
                              onCheckedChange={() => handleToggleActive(word.id, word.is_active)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {word.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(word.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(word.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prohibited Word?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this prohibited word from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Prohibited Words</DialogTitle>
            <DialogDescription>
              Enter multiple words or phrases, one per line. You can also separate them with commas or semicolons.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-words">Words/Phrases</Label>
              <Textarea
                id="bulk-words"
                placeholder="word1&#10;word2&#10;phrase one&#10;phrase two, phrase three; phrase four"
                value={bulkWords}
                onChange={(e) => setBulkWords(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Tip: Paste a list from Excel, text file, or type manually. Each word will be automatically cleaned and
                converted to lowercase.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBulkAdd} disabled={isBulkAdding || !bulkWords.trim()} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                {isBulkAdding ? 'Adding...' : 'Add Words'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkDialogOpen(false);
                  setBulkWords('');
                }}
                disabled={isBulkAdding}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
