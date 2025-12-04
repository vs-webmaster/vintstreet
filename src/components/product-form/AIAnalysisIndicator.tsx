import { Card } from '@/components/ui/card';

export const AIAnalysisIndicator = () => {
  return (
    <Card className="border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">✨ AI analyzing your image...</span>
      </div>
    </Card>
  );
};
