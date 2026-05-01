import { CheckCircle2, Clock, ImageIcon, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Doubt } from '@/types';
import ReactMarkdown from 'react-markdown';

interface DoubtTimelineProps {
  doubts: Doubt[];
}

const DoubtTimeline = ({ doubts }: DoubtTimelineProps) => {
  if (doubts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full mb-4">
          <ImageIcon className="w-16 h-16 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold mb-2">
          🎯 No doubts yet!
        </h3>
        <p className="text-muted-foreground text-lg">
          Upload your first question and start learning! 🚀✨
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        <Clock className="w-6 h-6 text-purple-600" />
        📚 Your Learning Journey
      </h2>

      <div className="space-y-6">
        {doubts.map((doubt, index) => (
          <Card key={doubt.id} className="p-6 bg-card border-2 border-primary/20 shadow-lg hover:shadow-2xl transition-all overflow-hidden relative">
            {/* Achievement badge for solved doubts */}
            {doubt.status === 'solved' && (
              <div className="absolute top-4 right-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  +10 XP
                </div>
              </div>
            )}

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={doubt.imageUrl}
                    alt="Doubt"
                    className="w-40 h-40 object-cover rounded-2xl border-4 border-purple-200 dark:border-purple-800 shadow-md"
                  />
                  {doubt.status === 'solved' && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold">
                    #{doubts.length - index}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(doubt.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  {doubt.status === 'solved' ? '✅' : '⏳'}
                  {doubt.question}
                </h3>

                {doubt.solution && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-4" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-1 mt-3" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li {...props} />,
                        }}
                      >
                        {doubt.solution}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {!doubt.solution && doubt.status === 'pending' && (
                  <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 p-4 rounded-2xl">
                    <Clock className="w-5 h-5 animate-pulse" />
                    <span className="font-medium">🤖 AI teacher is thinking hard...</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoubtTimeline;
