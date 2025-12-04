import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface CategorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  subcategories: Category[];
  subSubcategories: Category[];
  subSubSubcategories: Category[];
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedSubSubcategoryId: string;
  selectedSubSubSubcategoryId: string;
  onCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (subcategoryId: string) => void;
  onSubSubcategorySelect: (subSubcategoryId: string) => void;
  onSubSubSubcategorySelect: (subSubSubcategoryId: string) => void;
  onComplete: () => void;
  aiSuggestedCategoryId?: string;
  aiSuggestedSubcategoryId?: string;
  aiSuggestedSubSubcategoryId?: string;
  aiSuggestedSubSubSubcategoryId?: string;
}

type Screen = 'category' | 'subcategory' | 'subSubcategory' | 'subSubSubcategory';

export function CategorySelector({
  open,
  onOpenChange,
  categories,
  subcategories,
  subSubcategories,
  subSubSubcategories,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSubSubcategoryId,
  selectedSubSubSubcategoryId,
  onCategorySelect,
  onSubcategorySelect,
  onSubSubcategorySelect,
  onSubSubSubcategorySelect,
  onComplete,
  aiSuggestedCategoryId,
  aiSuggestedSubcategoryId,
  aiSuggestedSubSubcategoryId,
  aiSuggestedSubSubSubcategoryId,
}: CategorySelectorProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('category');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [userDeviatedFromAI, setUserDeviatedFromAI] = useState(false);

  // Reset view when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentScreen('category');
      setSlideDirection('right');
      setUserDeviatedFromAI(false);
    }
  }, [open]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedSubcategory = subcategories.find((s) => s.id === selectedSubcategoryId);
  const selectedSubSubcategory = subSubcategories.find((s) => s.id === selectedSubSubcategoryId);

  const handleCategoryClick = (categoryId: string, isAiSuggestion = false) => {
    onCategorySelect(categoryId);
    // Track if user deviated from AI suggestion
    if (!isAiSuggestion && aiSuggestedCategoryId && categoryId !== aiSuggestedCategoryId) {
      setUserDeviatedFromAI(true);
    }
    // Always navigate to the next screen; if there are no subcategories,
    // the empty state will offer a confirm button.
    setSlideDirection('right');
    setCurrentScreen('subcategory');
  };

  const handleSubcategoryClick = (subcategoryId: string, isAiSuggestion = false) => {
    onSubcategorySelect(subcategoryId);
    // Track if user deviated from AI suggestion
    if (!isAiSuggestion && aiSuggestedSubcategoryId && subcategoryId !== aiSuggestedSubcategoryId) {
      setUserDeviatedFromAI(true);
    }
    // Always navigate to the next screen; if there are no sub-subcategories,
    // the empty state will offer a confirm button.
    setSlideDirection('right');
    setCurrentScreen('subSubcategory');
  };

  const handleSubSubcategoryClick = (subSubcategoryId: string, isAiSuggestion = false) => {
    onSubSubcategorySelect(subSubcategoryId);
    // Track if user deviated from AI suggestion
    if (!isAiSuggestion && aiSuggestedSubSubcategoryId && subSubcategoryId !== aiSuggestedSubSubcategoryId) {
      setUserDeviatedFromAI(true);
    }
    setSlideDirection('right');
    setCurrentScreen('subSubSubcategory');
  };

  const handleSubSubSubcategoryClick = (subSubSubcategoryId: string) => {
    onSubSubSubcategorySelect(subSubSubcategoryId);
    setTimeout(() => {
      onComplete();
    }, 100);
  };

  const handleBack = () => {
    setSlideDirection('left');
    if (currentScreen === 'subSubSubcategory') {
      setCurrentScreen('subSubcategory');
    } else if (currentScreen === 'subSubcategory') {
      setCurrentScreen('subcategory');
    } else if (currentScreen === 'subcategory') {
      setCurrentScreen('category');
    }
  };

  const getTitle = () => {
    if (currentScreen === 'category') return 'Select Category';
    if (currentScreen === 'subcategory') return selectedCategory?.name || 'Select Subcategory';
    if (currentScreen === 'subSubcategory') return selectedSubcategory?.name || 'Select Type';
    return selectedSubSubcategory?.name || 'Select Specific Type';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Custom Header with Back/Close buttons */}
        <div className="flex items-center justify-between border-b bg-background px-6 py-4">
          <div className="flex flex-1 items-center gap-3">
            {currentScreen !== 'category' && (
              <Button type="button" variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{getTitle()}</h2>
              {currentScreen !== 'category' && (
                <p className="text-xs text-muted-foreground">
                  {currentScreen === 'subcategory'
                    ? 'Choose a subcategory'
                    : currentScreen === 'subSubcategory'
                      ? 'Choose a specific type'
                      : 'Choose a detailed type'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative h-[450px] overflow-hidden bg-background">
          {/* Category Screen */}
          <div
            className={cn(
              'absolute inset-0 transition-transform duration-300 ease-in-out',
              currentScreen === 'category'
                ? 'translate-x-0'
                : slideDirection === 'right'
                  ? '-translate-x-full'
                  : 'translate-x-full',
            )}
          >
            <ScrollArea className="h-full">
              <div className="space-y-2 p-4">
                {categories.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No categories available</p>
                  </div>
                ) : (
                  <>
                    {/* AI Suggested Category */}
                    {aiSuggestedCategoryId && !userDeviatedFromAI && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCategoryClick(aiSuggestedCategoryId, true);
                          }}
                          className="w-full rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 transition-all hover:shadow-md dark:border-purple-800 dark:from-purple-950/20 dark:to-blue-950/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              <div className="text-left">
                                <div className="font-semibold text-foreground">
                                  {categories.find((c) => c.id === aiSuggestedCategoryId)?.name}
                                </div>
                                <div className="text-xs text-muted-foreground">AI Suggested</div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                          </div>
                        </button>
                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-2 text-muted-foreground">Or browse all options</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Regular Categories */}
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCategoryClick(category.id);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-accent',
                          selectedCategoryId === category.id && 'border-primary bg-primary/5 shadow-sm',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-left font-medium">{category.name}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Subcategory Screen */}
          <div
            className={cn(
              'absolute inset-0 transition-transform duration-300 ease-in-out',
              currentScreen === 'subcategory'
                ? 'translate-x-0'
                : currentScreen === 'category'
                  ? 'translate-x-full'
                  : '-translate-x-full',
            )}
          >
            <ScrollArea className="h-full">
              <div className="space-y-2 p-4">
                {subcategories.length === 0 ? (
                  <div className="space-y-3 py-12 text-center text-muted-foreground">
                    <p>No subcategories available</p>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onComplete();
                      }}
                    >
                      Use {selectedCategory?.name}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* AI Suggested Subcategory */}
                    {aiSuggestedSubcategoryId &&
                      !userDeviatedFromAI &&
                      selectedCategoryId === aiSuggestedCategoryId && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubcategoryClick(aiSuggestedSubcategoryId, true);
                            }}
                            className="w-full rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 transition-all hover:shadow-md dark:border-purple-800 dark:from-purple-950/20 dark:to-blue-950/20"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <div className="text-left">
                                  <div className="font-semibold text-foreground">
                                    {subcategories.find((s) => s.id === aiSuggestedSubcategoryId)?.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">AI Suggested</div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                            </div>
                          </button>
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-background px-2 text-muted-foreground">Or browse all options</span>
                            </div>
                          </div>
                        </>
                      )}

                    {/* Regular Subcategories */}
                    {subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSubcategoryClick(subcategory.id);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-accent',
                          selectedSubcategoryId === subcategory.id && 'border-primary bg-primary/5 shadow-sm',
                        )}
                      >
                        <span className="text-left font-medium">{subcategory.name}</span>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sub-Subcategory Screen */}
          <div
            className={cn(
              'absolute inset-0 transition-transform duration-300 ease-in-out',
              currentScreen === 'subSubcategory'
                ? 'translate-x-0'
                : currentScreen === 'subcategory'
                  ? 'translate-x-full'
                  : '-translate-x-full',
            )}
          >
            <ScrollArea className="h-full">
              <div className="space-y-2 p-4">
                {subSubcategories.length === 0 ? (
                  <div className="space-y-3 py-12 text-center text-muted-foreground">
                    <p>No types available</p>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onComplete();
                      }}
                    >
                      Use {selectedSubcategory?.name}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* AI Suggested Sub-Subcategory */}
                    {aiSuggestedSubSubcategoryId &&
                      !userDeviatedFromAI &&
                      selectedCategoryId === aiSuggestedCategoryId &&
                      selectedSubcategoryId === aiSuggestedSubcategoryId && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubSubcategoryClick(aiSuggestedSubSubcategoryId, true);
                            }}
                            className="w-full rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 transition-all hover:shadow-md dark:border-purple-800 dark:from-purple-950/20 dark:to-blue-950/20"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <div className="text-left">
                                  <div className="font-semibold text-foreground">
                                    {subSubcategories.find((s) => s.id === aiSuggestedSubSubcategoryId)?.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">AI Suggested</div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                            </div>
                          </button>
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-background px-2 text-muted-foreground">Or browse all options</span>
                            </div>
                          </div>
                        </>
                      )}

                    {/* Regular Sub-Subcategories */}
                    {subSubcategories.map((subSubcategory) => (
                      <button
                        key={subSubcategory.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSubSubcategoryClick(subSubcategory.id);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-accent',
                          selectedSubSubcategoryId === subSubcategory.id && 'border-primary bg-primary/5 shadow-sm',
                        )}
                      >
                        <span className="text-left font-medium">{subSubcategory.name}</span>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sub-Sub-Subcategory Screen */}
          <div
            className={cn(
              'absolute inset-0 transition-transform duration-300 ease-in-out',
              currentScreen === 'subSubSubcategory' ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <ScrollArea className="h-full">
              <div className="space-y-2 p-4">
                {subSubSubcategories.length === 0 ? (
                  <div className="space-y-3 py-12 text-center text-muted-foreground">
                    <p>No specific types available</p>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onComplete();
                      }}
                    >
                      Use {selectedSubSubcategory?.name}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* AI Suggested Sub-Sub-Subcategory */}
                    {aiSuggestedSubSubSubcategoryId &&
                      !userDeviatedFromAI &&
                      selectedCategoryId === aiSuggestedCategoryId &&
                      selectedSubcategoryId === aiSuggestedSubcategoryId &&
                      selectedSubSubcategoryId === aiSuggestedSubSubcategoryId && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubSubSubcategoryClick(aiSuggestedSubSubSubcategoryId);
                            }}
                            className="w-full rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 transition-all hover:shadow-md dark:border-purple-800 dark:from-purple-950/20 dark:to-blue-950/20"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <div className="text-left">
                                  <div className="font-semibold text-foreground">
                                    {subSubSubcategories.find((s) => s.id === aiSuggestedSubSubSubcategoryId)?.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">AI Suggested</div>
                                </div>
                              </div>
                            </div>
                          </button>
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-background px-2 text-muted-foreground">Or browse all options</span>
                            </div>
                          </div>
                        </>
                      )}

                    {/* Regular Sub-Sub-Subcategories */}
                    {subSubSubcategories.map((subSubSubcategory) => (
                      <button
                        key={subSubSubcategory.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSubSubSubcategoryClick(subSubSubcategory.id);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-accent',
                          selectedSubSubSubcategoryId === subSubSubcategory.id &&
                            'border-primary bg-primary/5 shadow-sm',
                        )}
                      >
                        <span className="text-left font-medium">{subSubSubcategory.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
