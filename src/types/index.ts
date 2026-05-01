export interface User {
  phone: string;
  class: string;
  otp?: string;
}

export interface Doubt {
  id: string;
  imageUrl: string;
  question: string;
  solution: string;
  subject?: string;
  timestamp: number;
  status: 'pending' | 'solved';
}
