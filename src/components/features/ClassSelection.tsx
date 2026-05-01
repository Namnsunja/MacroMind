import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import TeacherLogo from '@/components/layout/TeacherLogo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { saveUser } from '@/lib/auth';
import { toast } from 'sonner';

interface ClassSelectionProps {
  phone: string;
  onComplete: () => void;
}

const CLASSES = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

const ClassSelection = ({ phone, onComplete }: ClassSelectionProps) => {
  const [selectedClass, setSelectedClass] = useState('');

  const handleContinue = () => {
    if (!selectedClass) {
      toast.error('Please select your class');
      return;
    }

    saveUser({ phone, class: selectedClass });
    toast.success(`Welcome to MacroMind! 🎉`);
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-card border-4 border-primary/20 shadow-2xl rounded-3xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <TeacherLogo className="w-20 h-20" />
          </div>
          <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎓 Choose Your Class
          </h2>
          <p className="text-lg font-semibold text-muted-foreground">
            Select the class you're currently studying in
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`
                relative aspect-square rounded-xl font-bold text-xl transition-all
                ${selectedClass === cls
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white scale-105 shadow-lg'
                  : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                }
              `}
            >
              Class {cls}
              {selectedClass === cls && (
                <CheckCircle2 className="absolute -top-2 -right-2 w-6 h-6 text-green-400 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedClass}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-14 text-lg font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"
        >
          🚀 Start Learning!
        </Button>
      </Card>
    </div>
  );
};

export default ClassSelection;
