import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { saveDoubt, generateSolution } from '@/lib/doubts';
import { Doubt } from '@/types';
import { toast } from 'sonner';

interface DoubtUploadProps {
  onDoubtUploaded: () => void;
}

const DoubtUpload = ({ onDoubtUploaded }: DoubtUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setPreview(imageData);
      await processDoubt(imageData);
    };
    reader.readAsDataURL(file);
  };

  const processDoubt = async (imageData: string) => {
    setUploading(true);
    console.log('Processing doubt image...');

    try {
      const newDoubt: Doubt = {
        id: Date.now().toString(),
        imageUrl: imageData,
        question: '🔍 AI is analyzing your doubt...',
        solution: '',
        timestamp: Date.now(),
        status: 'pending',
      };

      saveDoubt(newDoubt);
      toast.success('📸 Doubt uploaded! AI is working its magic...');
      onDoubtUploaded();
      
      // Generate AI solution
      const { solution, modelUsed } = await generateSolution(imageData);
      
      // Update with solution
      const updatedDoubts = JSON.parse(localStorage.getItem('macromind_doubts') || '[]');
      const doubtIndex = updatedDoubts.findIndex((d: Doubt) => d.id === newDoubt.id);
      if (doubtIndex !== -1) {
        updatedDoubts[doubtIndex].solution = solution;
        updatedDoubts[doubtIndex].question = `Solved by ${modelUsed} 🤖`;
        updatedDoubts[doubtIndex].status = 'solved';
        localStorage.setItem('macromind_doubts', JSON.stringify(updatedDoubts));
      }

      toast.success('🎉 Solution ready! You\'re getting smarter!');
      onDoubtUploaded();
      setPreview(null);
    } catch (error: any) {
      console.error('Error processing doubt:', error);
      toast.error(error.message || 'Oops! Please try again.');
      
      // Remove the pending doubt on error
      const doubts = JSON.parse(localStorage.getItem('macromind_doubts') || '[]');
      const filtered = doubts.filter((d: Doubt) => d.status !== 'pending');
      localStorage.setItem('macromind_doubts', JSON.stringify(filtered));
      onDoubtUploaded();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 mb-8 bg-card border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        <Camera className="w-6 h-6 text-purple-600" />
        📸 Snap Your Doubt!
      </h2>
      <p className="text-muted-foreground mb-6">
        ✨ Take a photo and our AI teacher will solve it instantly! 🧠💡
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview && (
        <div className="mb-4 rounded-lg overflow-hidden border-2 border-purple-200">
          <img src={preview} alt="Doubt preview" className="w-full max-h-64 object-contain bg-gray-50" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-14 text-lg font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              🤖 Analyzing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              📤 Upload
            </>
          )}
        </Button>

        <Button
          onClick={() => {
            const input = fileInputRef.current;
            if (input) {
              input.capture = 'environment';
              input.click();
            }
          }}
          disabled={uploading}
          variant="outline"
          className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 h-14 text-lg font-bold rounded-2xl hover:scale-105 transition-transform"
        >
          <Camera className="w-5 h-5 mr-2" />
          📷 Camera
        </Button>
      </div>
    </Card>
  );
};

export default DoubtUpload;
