import { User } from '@/types';

const USER_KEY = 'macromind_user';
const OTP_KEY = 'macromind_otp';

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(OTP_KEY);
};

export const generateOTP = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem(OTP_KEY, otp);
  console.log('Generated OTP:', otp);
  return otp;
};

export const verifyOTP = (inputOTP: string): boolean => {
  const storedOTP = localStorage.getItem(OTP_KEY);
  return inputOTP === storedOTP;
};
