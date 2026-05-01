import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/lib/auth';
import PhoneAuth from '@/components/features/PhoneAuth';
import ClassSelection from '@/components/features/ClassSelection';

const Index = () => {
  const [step, setStep] = useState<'phone' | 'class'>('phone');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    if (user && user.class) navigate('/dashboard');
  }, [navigate]);

  const handlePhoneVerified = (verifiedPhone: string) => {
    setPhone(verifiedPhone);
    setStep('class');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-cyan-600/6 rounded-full blur-3xl pointer-events-none" />

      {step === 'phone' ? (
        <PhoneAuth onVerified={handlePhoneVerified} />
      ) : (
        <ClassSelection phone={phone} onComplete={() => navigate('/dashboard')} />
      )}
    </div>
  );
};

export default Index;
