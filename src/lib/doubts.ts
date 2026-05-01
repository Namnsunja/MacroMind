import { Doubt } from '@/types';
import { createClient } from '@supabase/supabase-js';

const DOUBTS_KEY = 'macromind_doubts';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const saveDoubt = (doubt: Doubt) => {
  const doubts = getDoubts();
  doubts.unshift(doubt);
  localStorage.setItem(DOUBTS_KEY, JSON.stringify(doubts));
};

export const getDoubts = (): Doubt[] => {
  const doubtsData = localStorage.getItem(DOUBTS_KEY);
  return doubtsData ? JSON.parse(doubtsData) : [];
};

export const updateDoubtSolution = (id: string, solution: string) => {
  const doubts = getDoubts();
  const doubtIndex = doubts.findIndex(d => d.id === id);
  if (doubtIndex !== -1) {
    doubts[doubtIndex].solution = solution;
    doubts[doubtIndex].status = 'solved';
    localStorage.setItem(DOUBTS_KEY, JSON.stringify(doubts));
  }
};

// Real AI solution generator using OnSpace AI
export const generateSolution = async (imageBase64: string): Promise<{ solution: string; modelUsed: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-doubt', {
      body: { imageBase64 }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error('Failed to analyze doubt. Please try again.');
    }

    return {
      solution: data.solution || 'Unable to generate solution.',
      modelUsed: data.modelUsed || 'unknown'
    };
  } catch (error) {
    console.error('Error generating solution:', error);
    throw error;
  }
};
