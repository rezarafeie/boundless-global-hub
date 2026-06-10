// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { MessageCircle, Phone, User, Lock, AtSign, AlertCircle, Check, Loader2 } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { detectCountryCode, formatPhoneWithCountryCode, getCountryCodeOptions } from '@/lib/countryCodeUtils';
import useGoogleAuthSettings from '@/hooks/useGoogleAuthSettings';
import { rafieiAuth } from '@/lib/rafieiAuth';
import TelegramAuthPanel from '@/components/Chat/TelegramAuthPanel';

interface UnifiedMessengerAuthProps {
  onAuthenticated: (sessionToken: string, userName: string, user: MessengerUser) => void;
  prefillData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  linkingEmail?: string | null;
  isAcademyAuth?: boolean; // Add flag to distinguish academy vs messenger auth
}

type AuthStep = 'phone' | 'password' | 'password-setup' | 'name' | 'username' | 'pending' | 'otp-link' | 'otp-login' | 'linking' | 'name-confirm' | 'success' | 'forgot-password' | 'forgot-otp' | 'reset-password';

const UnifiedMessengerAuth: React.FC<UnifiedMessengerAuthProps> = ({ onAuthenticated, prefillData, linkingEmail, isAcademyAuth = false }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+98');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(prefillData?.firstName || '');
  const [lastName, setLastName] = useState(prefillData?.lastName || '');
  const [email, setEmail] = useState(prefillData?.email || '');
  const [username, setUsername] = useState('');
  const [isBoundlessStudent, setIsBoundlessStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isGoogleAuthEnabled } = useGoogleAuthSettings();
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState('');
  const [existingUser, setExistingUser] = useState<MessengerUser | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isGoogleLinking, setIsGoogleLinking] = useState(false);
  const [formattedPhoneForOTP, setFormattedPhoneForOTP] = useState('');
  const [otpVerified, setOtpVerified] = useState(false); // Track OTP verification status
  const [authMethod, setAuthMethod] = useState<'phone' | 'telegram'>('phone');
  const [otpIdentifierType, setOtpIdentifierType] = useState<'phone' | 'email'>('phone');

  const isEmailInput = (val: string) => /@/.test(val);

  // Initialize linking flow if linkingEmail is provided
  useEffect(() => {
    if (linkingEmail) {
      console.log('🔗 Initializing linking flow for:', linkingEmail);
      setEmail(linkingEmail);
      setFirstName(prefillData?.firstName || '');
      setLastName(prefillData?.lastName || '');
      setCurrentStep('linking');
    }
  }, [linkingEmail]);

  // Helper function to parse names from user data
  const parseUserNames = (user: MessengerUser) => {
    // Check if user has separate first_name and last_name
    if (user.first_name && user.last_name) {
      return {
        firstName: user.first_name,
        lastName: user.last_name
      };
    }
    
    // If user has full_name, try to split it
    if (user.full_name) {
      const nameParts = user.full_name.trim().split(' ');
      return {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      };
    }
    
    // Fallback to name field
    if (user.name) {
      const nameParts = user.name.trim().split(' ');
      return {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      };
    }
    
    return {
      firstName: '',
      lastName: ''
    };
  };

  // Enhanced phone number lookup with multiple format attempts
  const findUserByPhone = async (phone: string, countryCode: string): Promise<MessengerUser | null> => {
    console.log('🔍 Searching for user with phone:', phone, 'country code:', countryCode);
    
    // Try different phone number formats
    const phoneFormats = [];
    
    if (countryCode === '+98') {
      // Iranian phone number formats
      phoneFormats.push(
        `+98${phone}`,           // +989xxxxxxxxx
        `0098${phone}`,          // 00989xxxxxxxxx  
        `98${phone}`,            // 989xxxxxxxxx
        `0${phone}`,             // 09xxxxxxxxx
        phone                    // 9xxxxxxxxx
      );
    } else {
      // Other country formats
      phoneFormats.push(
        `${countryCode}${phone}`,
        `00${countryCode.slice(1)}${phone}`,
        phone
      );
    }

    console.log('📞 Trying phone formats:', phoneFormats);

    // Try each format
    for (const phoneFormat of phoneFormats) {
      try {
        console.log('🔍 Trying phone format:', phoneFormat);
        const user = await messengerService.getUserByPhone(phoneFormat);
        if (user) {
          console.log('✅ Found user with phone format:', phoneFormat, 'User:', user);
          return user;
        }
      } catch (error) {
        console.log('❌ No user found with format:', phoneFormat);
        continue;
      }
    }

    console.log('❌ No user found with any phone format');
    return null;
  };

  const validateUsername = (value: string) => {
    const regex = /^[a-z0-9_]{3,20}$/;
    if (!value) return '';
    if (!regex.test(value)) {
      return 'نام کاربری باید بین ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی کوچک، اعداد و _ باشد';
    }
    return '';
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameAvailable(false);
      return;
    }

    setUsernameChecking(true);
    setUsernameError('');
    
    try {
      const isAvailable = await privateMessageService.checkUsernameAvailability(username);
      setUsernameAvailable(isAvailable);
      if (!isAvailable) {
        setUsernameError('این نام کاربری قبلاً انتخاب شده است');
      }
    } catch (error) {
      setUsernameError('خطا در بررسی نام کاربری');
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email) {
      setEmailAvailable(null);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('ایمیل وارد شده معتبر نیست');
      setEmailAvailable(false);
      return;
    }

    setEmailChecking(true);
    setEmailError('');
    
    try {
      // Check both academy and chat users tables for duplicate email
      const { data: academyUser } = await supabase
        .from('academy_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      const { data: chatUser } = await supabase
        .from('chat_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      const isAvailable = !academyUser && !chatUser;
      setEmailAvailable(isAvailable);
      
      if (!isAvailable) {
        setEmailError('این ایمیل قبلاً استفاده شده است');
      }
    } catch (error) {
      // If both queries fail (no results), email is available
      setEmailAvailable(true);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleEmailChange = (value: string) => {
    const lowerValue = value.toLowerCase();
    setEmail(lowerValue);
    setEmailAvailable(null);
    setEmailError('');

    if (lowerValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lowerValue)) {
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(lowerValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleUsernameChange = (value: string) => {
    const lowerValue = value.toLowerCase();
    setUsername(lowerValue);
    setUsernameAvailable(null);
    setUsernameError('');

    if (lowerValue.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(lowerValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('شماره تلفن یا ایمیل را وارد کنید');
      return;
    }

    // Email branch: only supports login of existing accounts
    if (isEmailInput(phoneNumber)) {
      const emailId = phoneNumber.trim().toLowerCase();
      setLoading(true);
      try {
        const { data: userByEmail } = await supabase
          .from('chat_users')
          .select('*')
          .eq('email', emailId)
          .maybeSingle();

        if (!userByEmail) {
          toast.error('کاربری با این ایمیل یافت نشد. لطفاً با شماره تلفن ثبت نام کنید.');
          return;
        }

        setExistingUser(userByEmail as any);
        setIsLogin(true);
        setOtpIdentifierType('email');
        setFormattedPhoneForOTP(emailId);

        // If user has no password OR clicks via login flow, send email OTP
        if (!userByEmail.password_hash) {
          try {
            await rafieiAuth.sendEmailOTP(emailId);
            setCurrentStep('otp-login');
            toast.success('کد تأیید به ایمیل شما ارسال شد');
          } catch (err: any) {
            console.error('Email OTP send error:', err);
            toast.error(err.message || 'خطا در ارسال کد ایمیل');
          }
        } else {
          // Has password: go to password step (OTP fallback available)
          setCurrentStep('password');
        }
      } catch (err) {
        console.error('Email lookup error:', err);
        toast.error('خطا در بررسی ایمیل');
      } finally {
        setLoading(false);
      }
      return;
    }

    setOtpIdentifierType('phone');

    setLoading(true);
    try {
      // Enhanced user lookup with multiple phone formats
      const user = await findUserByPhone(phoneNumber, countryCode);
      
      // Special handling for linking flow from URL parameter
      if (currentStep === 'linking' && linkingEmail) {
        if (user) {
          console.log('🔗 Found existing user for linking:', user);
          setExistingUser(user);
          setIsGoogleLinking(true);
          
          // Parse and set the existing user's names
          const { firstName: userFirstName, lastName: userLastName } = parseUserNames(user);
          console.log('📝 Setting names from existing user:', { userFirstName, userLastName });
          setFirstName(userFirstName);
          setLastName(userLastName);
          
          // Skip OTP for non-Iranian users in linking flow
          if (countryCode !== '+98') {
            console.log('🌍 Non-Iranian user linking, skipping OTP');
            setOtpVerified(true);
            setCurrentStep('name-confirm');
          } else {
            // Send OTP for linking Iranian users
            try {
              const response = await rafieiAuth.sendSMSOTP(phoneNumber, countryCode);
              console.log('📱 OTP sent successfully for linking:', response);
              
              setCurrentStep('otp-link');
              toast.success('کد تأیید ارسال شد', {
                description: 'کد ۴ رقمی برای ربط حساب Google به شماره شما ارسال شد'
              });
            } catch (otpError: any) {
              console.error('OTP send error for linking:', otpError);
              throw new Error(otpError.message || 'خطا در ارسال کد تأیید');
            }
          }
        } else {
          // Phone number doesn't exist, need to create new user with linking data
          setIsLogin(false);
          setIsGoogleLinking(true);
          setCurrentStep('password');
        }
        setLoading(false);
        return;
      }
      
      // Regular flow (not linking)
      if (user) {
        setExistingUser(user);
        
        // Check if user has a password - if not, send OTP automatically
        if (!user.password_hash) {
          console.log('🔐 User has no password, sending OTP automatically');
          setIsLogin(true);
          
          // Non-Iranian user without password: send email OTP if email on file
          if (countryCode !== '+98') {
            if (user.email) {
              try {
                await rafieiAuth.sendEmailOTP(user.email);
                setOtpIdentifierType('email');
                setFormattedPhoneForOTP(user.email);
                setCurrentStep('otp-login');
                toast.success('کد تأیید به ایمیل شما ارسال شد');
              } catch (err: any) {
                console.error('Email OTP error:', err);
                setCurrentStep('password');
                toast.error('خطا در ارسال کد، لطفاً رمز عبور تعین کنید');
              }
            } else {
              console.log('🌍 Non-Iranian user without password or email, password setup');
              setCurrentStep('password');
            }
          } else {
            // Send SMS OTP for Iranian users
            console.log('📱 About to send OTP for Iranian user:', phoneNumber, 'Country code:', countryCode);
            try {
              const response = await rafieiAuth.sendSMSOTP(phoneNumber, countryCode);
              console.log('📱 OTP sent successfully:', response);
              
              let formattedPhone = phoneNumber;
              if (countryCode === '+98') {
                let cleanPhone = phoneNumber.replace(/\s|-/g, '');
                if (cleanPhone.startsWith('0')) {
                  cleanPhone = cleanPhone.substring(1);
                }
                formattedPhone = `${countryCode}${cleanPhone}`;
              }
              setOtpIdentifierType('phone');
              setFormattedPhoneForOTP(formattedPhone);
              
              setCurrentStep('otp-login');
              toast.success('کد تأیید ارسال شد', {
                description: 'کد ۴ رقمی برای ورود به شماره شما ارسال شد'
              });
            } catch (otpError: any) {
              console.error('❌ OTP send error:', otpError);
              setCurrentStep('password');
              toast.error('خطا در ارسال کد تأیید، لطفاً رمز عبور تعین کنید');
            }
          }
        } else if (prefillData?.email && !user.email) {
          console.log('🔗 Google user wants to link to existing phone number');
          setIsGoogleLinking(true);
          
          // Parse and set the existing user's names
          const { firstName: userFirstName, lastName: userLastName } = parseUserNames(user);
          console.log('📝 Setting names from existing user:', { userFirstName, userLastName });
          setFirstName(userFirstName);
          setLastName(userLastName);
          
          // Skip OTP for non-Iranian users linking Google account
          if (countryCode !== '+98') {
            console.log('🌍 Non-Iranian user linking Google account, skipping OTP');
            setOtpVerified(true);
            setCurrentStep('name-confirm');
          } else {
            // Send OTP for verification for Iranian users
            try {
              const response = await rafieiAuth.sendSMSOTP(phoneNumber, countryCode);
              console.log('📱 OTP sent successfully for Google linking:', response);
              
              setCurrentStep('otp-link');
              toast.success('کد تأیید ارسال شد', {
                description: 'کد ۴ رقمی برای ربط حساب Google به شماره شما ارسال شد'
              });
            } catch (otpError: any) {
              console.error('OTP send error for Google linking:', otpError);
              throw new Error(otpError.message || 'خطا در ارسال کد تأیید');
            }
          }
        } else {
          // Normal login flow - user has password
          setIsLogin(true);
          setCurrentStep('password');
        }
      } else {
        setIsLogin(false);
        // Skip OTP for non-Iranian new users
        if (countryCode !== '+98') {
          console.log('🌍 Non-Iranian new user, skipping OTP');
          setCurrentStep('password');
        } else {
          setCurrentStep('password');
        }
      }
    } catch (error) {
      console.error('Error checking phone:', error);
      toast.error('خطا در بررسی شماره تلفن');
      // If error, assume new user
      setIsLogin(false);
      setCurrentStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('رمز عبور را وارد کنید');
      return;
    }

    if (isLogin) {
      // Login flow
      setLoading(true);
      try {
        let result;
        
        if (isAcademyAuth) {
          // Use unified auth service for academy authentication
          console.log('🎓 Academy login attempt for:', phoneNumber);
          const { unifiedAuthService } = await import('@/lib/unifiedAuthService');
          
          try {
            const authResult = await unifiedAuthService.authenticateUser(phoneNumber, password, countryCode);
            console.log('✅ Academy authentication successful');
            result = { session_token: authResult.sessionToken };
          } catch (authError: any) {
            console.error('Academy auth error:', authError);
            toast.error(authError.message || 'رمز عبور اشتباه است');
            return;
          }
        } else {
          // Use messenger service for messenger authentication
          console.log('💬 Messenger login attempt for:', phoneNumber);
          result = await messengerService.authenticateUser(phoneNumber, password, countryCode);
        }
        
        if (result && existingUser) {
          if (!existingUser.is_approved) {
            setCurrentStep('pending');
            return;
          }
          onAuthenticated(result.session_token, existingUser.name, existingUser);
        } else {
          toast.error('رمز عبور اشتباه است');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error(error.message || 'رمز عبور اشتباه است');
      } finally {
        setLoading(false);
      }
    } else {
      // For non-Iranian users, skip OTP and go to name step
      if (countryCode !== '+98') {
        console.log('🌍 Non-Iranian user registration, skipping OTP');
        setCurrentStep('name');
      } else {
        // Continue to name step for Iranian users (they will do OTP after password)
        setCurrentStep('name');
      }
    }
  };

  const handleOTPLogin = async () => {
    setLoading(true);
    try {
      // Decide channel: email if user entered email or has email and is non-Iranian
      const isEmail = isEmailInput(phoneNumber);
      if (isEmail) {
        const emailId = phoneNumber.trim().toLowerCase();
        await rafieiAuth.sendEmailOTP(emailId);
        setOtpIdentifierType('email');
        setFormattedPhoneForOTP(emailId);
        toast.success('کد تأیید به ایمیل شما ارسال شد');
      } else if (countryCode !== '+98' && existingUser?.email) {
        await rafieiAuth.sendEmailOTP(existingUser.email);
        setOtpIdentifierType('email');
        setFormattedPhoneForOTP(existingUser.email);
        toast.success('کد تأیید به ایمیل شما ارسال شد');
      } else {
        const response = await rafieiAuth.sendSMSOTP(phoneNumber, countryCode);
        console.log('📱 OTP sent successfully for login:', response);
        let formattedPhone = phoneNumber;
        if (countryCode === '+98') {
          let cleanPhone = phoneNumber.replace(/\s|-/g, '');
          if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
          formattedPhone = `${countryCode}${cleanPhone}`;
        }
        setOtpIdentifierType('phone');
        setFormattedPhoneForOTP(formattedPhone);
        toast.success('کد تأیید ارسال شد', {
          description: 'کد ۴ رقمی برای ورود به شماره شما ارسال شد'
        });
      }
      setCurrentStep('otp-login');
    } catch (error: any) {
      console.error('OTP send error for login:', error);
      toast.error(error.message || 'خطا در ارسال کد تأیید');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('نام و نام خانوادگی را وارد کنید');
      return;
    }

    if (!email.trim()) {
      toast.error('ایمیل را وارد کنید');
      return;
    }

    // Check if email is available
    if (!emailAvailable) {
      toast.error('ایمیل انتخاب شده معتبر نیست یا قبلاً استفاده شده است');
      return;
    }

    // For academy auth, skip username step and register directly
    if (isAcademyAuth) {
      setLoading(true);
      try {
        // Register academy user without username
        const result = await messengerService.registerWithPassword({
          name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phoneNumber,
          countryCode: countryCode,
          password: password,
          email: email.trim(),
          isBoundlessStudent: isBoundlessStudent,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        });

        // Check if user needs approval
        if (!result.user.is_approved) {
          setCurrentStep('pending');
          return;
        }

        // User is auto-approved, proceed to login
        onAuthenticated(result.session_token, result.user.name, result.user);
      } catch (error: any) {
        console.error('Registration error:', error);
        toast.error(error.message || 'لطفاً دوباره تلاش کنید');
      } finally {
        setLoading(false);
      }
    } else {
      // For messenger auth, continue to username step
      setCurrentStep('username');
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('نام کاربری را وارد کنید');
      return;
    }

    if (!usernameAvailable) {
      toast.error('نام کاربری انتخاب شده معتبر نیست');
      return;
    }

    setLoading(true);
    try {
      // Register user with separate country code, include linking email if available
      const emailToUse = linkingEmail || email.trim();
      const result = await messengerService.registerWithPassword({
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phoneNumber,
        countryCode: countryCode,
        username: username,
        password: password,
        email: emailToUse,
        isBoundlessStudent: isBoundlessStudent,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      // Check if user needs approval
      if (!result.user.is_approved) {
        setCurrentStep('pending');
        return;
      }

      // User is auto-approved, proceed to login
      onAuthenticated(result.session_token, result.user.name, result.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'لطفاً دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginOTP = async (code: string) => {
    if (code.length !== 4) return;

    setLoading(true);
    
    try {
      if (otpIdentifierType === 'email') {
        await rafieiAuth.verifyEmailOTP(formattedPhoneForOTP, code);
      } else {
        const phoneForVerification = formattedPhoneForOTP;
        if (!phoneForVerification) {
          let fallbackFormattedPhone = phoneNumber;
          if (countryCode === '+98') {
            let cleanPhone = phoneNumber.replace(/\s|-/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
            fallbackFormattedPhone = `${countryCode}${cleanPhone}`;
          }
          await rafieiAuth.verifyOTP(fallbackFormattedPhone, code, countryCode);
        } else {
          await rafieiAuth.verifyOTP(phoneForVerification, code, countryCode);
        }
      }
      console.log('✅ OTP verified successfully for login');
      setOtpVerified(true);
        
        if (existingUser) {
          if (!existingUser.is_approved) {
            setCurrentStep('pending');
            return;
          }
          
          // Check if user has no password - if so, ask them to set one
          if (!existingUser.password_hash) {
            console.log('🔐 User has no password, requesting password setup');
            setCurrentStep('password-setup');
            toast.success('لطفاً رمز عبور جدید تعین کنید');
            return;
          }
          
          // Create session for OTP login
          const sessionToken = await messengerService.createSession(existingUser.id);
          onAuthenticated(sessionToken, existingUser.name, existingUser);
        } else {
          toast.error('کاربر یافت نشد');
        }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'کد وارد شده اشتباه است');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const verifyLinkingOTP = async (code: string) => {
    if (code.length !== 4) return;

    setLoading(true);
    
    try {
      // Use the exact same formatted phone that was stored when OTP was sent
      const phoneForVerification = formattedPhoneForOTP;
      
      console.log('🔍 Debug OTP linking verification:', {
        formattedPhoneForOTP,
        phoneForVerification,
        phoneNumber,
        countryCode
      });
      
      if (!phoneForVerification) {
        console.error('❌ formattedPhoneForOTP is null/undefined for linking, creating phone format now...');
        // Fallback: create the formatted phone if it's not set
        let fallbackFormattedPhone = phoneNumber;
        if (countryCode === '+98') {
          let cleanPhone = phoneNumber.replace(/\s|-/g, '');
          if (cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.substring(1);
          }
          fallbackFormattedPhone = `${countryCode}${cleanPhone}`;
        }
        console.log('🔧 Using fallback formatted phone for linking:', fallbackFormattedPhone);
        
        await rafieiAuth.verifyOTP(fallbackFormattedPhone, code, countryCode);
      } else {
        await rafieiAuth.verifyOTP(phoneForVerification, code, countryCode);
      }
      console.log('✅ OTP verified successfully, moving to name confirmation');
        setOtpVerified(true);
        
        // Ensure names are properly set from existing user before showing confirmation
        if (existingUser) {
          const { firstName: userFirstName, lastName: userLastName } = parseUserNames(existingUser);
          console.log('📝 Final name check before confirmation:', { userFirstName, userLastName });
          setFirstName(userFirstName);
          setLastName(userLastName);
        }
        
        setCurrentStep('name-confirm');
        toast.success('کد تأیید شد', {
          description: 'اطلاعات خود را بررسی و تأیید کنید'
        });
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'کد وارد شده اشتباه است');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  // New function to handle final name confirmation and account linking
  const handleNameConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('نام و نام خانوادگی را وارد کنید');
      return;
    }

    setLoading(true);
    
    try {
      // If existingUser is null, try to find the user again
      let userToUpdate = existingUser;
      if (!userToUpdate) {
        console.log('🔍 ExistingUser is null, searching again...');
        userToUpdate = await findUserByPhone(phoneNumber, countryCode);
        
        if (!userToUpdate) {
          throw new Error('کاربر یافت نشد. لطفاً دوباره تلاش کنید.');
        }
        
        console.log('✅ Found user on retry:', userToUpdate);
        setExistingUser(userToUpdate);
      }

      // Link Google email to the existing account
      const emailToLink = linkingEmail || prefillData?.email;
      const firstNameToLink = firstName.trim();
      const lastNameToLink = lastName.trim();
      
      console.log('🔗 Linking email to user:', emailToLink, 'User ID:', userToUpdate.id);

      // Check if another user already has this email
      if (emailToLink) {
        const { data: existingEmailUser } = await supabase
          .from('chat_users')
          .select('id, name, phone')
          .eq('email', emailToLink)
          .neq('id', userToUpdate.id)
          .maybeSingle();

        if (existingEmailUser) {
          console.warn('⚠️ Email already used by another user:', existingEmailUser.id);
          throw new Error(
            `این ایمیل (${emailToLink}) قبلاً توسط حساب دیگری استفاده شده است. لطفاً با پشتیبانی تماس بگیرید.`
          );
        }
      }
      
      const { error: updateError } = await supabase
        .from('chat_users')
        .update({
          email: emailToLink,
          first_name: firstNameToLink,
          last_name: lastNameToLink,
          full_name: `${firstNameToLink} ${lastNameToLink}`
        })
        .eq('id', userToUpdate.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Create session and login
      const sessionToken = await messengerService.createSession(userToUpdate.id);
      
      // Update the user object with new data
      const updatedUser = {
        ...userToUpdate,
        email: emailToLink || userToUpdate.email,
        first_name: firstNameToLink,
        last_name: lastNameToLink,
        full_name: `${firstNameToLink} ${lastNameToLink}`
      };

      toast.success('حساب Google شما با موفقیت ربط داده شد');

      console.log('🎉 Linking successful, showing success...');
      setCurrentStep('success');
      
      // Auto-login after showing success message
      setTimeout(() => {
        onAuthenticated(sessionToken, updatedUser.name, updatedUser);
      }, 2000);
    } catch (error: any) {
      console.error('Error in name confirmation:', error);
      toast.error(error.message || 'لطفاً دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('رمز عبور را وارد کنید');
      return;
    }

    if (password.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Setting up password for user:', existingUser?.id);
      
      // Update user password in database
      const { error: updateError } = await supabase
        .from('chat_users')
        .update({
          password_hash: password // This will be hashed by the backend
        })
        .eq('id', existingUser?.id);

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      console.log('✅ Password set successfully');
      
      // Create session and login
      if (existingUser) {
        const sessionToken = await messengerService.createSession(existingUser.id);
        
        // Update the existing user object
        const updatedUser = {
          ...existingUser,
          password_hash: password
        };
        
        toast.success('رمز عبور با موفقیت تنظیم شد');
        onAuthenticated(sessionToken, updatedUser.name, updatedUser);
      }
    } catch (error: any) {
      console.error('Password setup error:', error);
      toast.error(error.message || 'خطا در تنظیم رمز عبور');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify OTP when 4 digits are entered
  useEffect(() => {
    if (otpCode.length === 4 && currentStep === 'otp-link') {
      verifyLinkingOTP(otpCode);
    }
  }, [otpCode, currentStep]);

  const checkApprovalStatus = async () => {
    setLoading(true);
    try {
      const user = await messengerService.getUserByPhone(phoneNumber, countryCode);
      if (user && user.is_approved) {
        const session = await messengerService.createSession(user.id);
        onAuthenticated(session.session_token, user.name, user);
      } else {
        toast.info('حساب شما هنوز توسط مدیریت تایید نشده است');
      }
    } catch (error) {
      console.error('Error checking approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordOTP = async () => {
    setLoading(true);
    try {
      const isEmail = isEmailInput(phoneNumber);
      if (isEmail) {
        const emailId = phoneNumber.trim().toLowerCase();
        await rafieiAuth.sendEmailOTP(emailId);
        setOtpIdentifierType('email');
        setFormattedPhoneForOTP(emailId);
      } else if (countryCode !== '+98' && existingUser?.email) {
        await rafieiAuth.sendEmailOTP(existingUser.email);
        setOtpIdentifierType('email');
        setFormattedPhoneForOTP(existingUser.email);
      } else {
        await rafieiAuth.sendSMSOTP(phoneNumber, countryCode);
        let formattedPhone = phoneNumber;
        if (countryCode === '+98') {
          let cleanPhone = phoneNumber.replace(/\s|-/g, '');
          if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
          formattedPhone = `${countryCode}${cleanPhone}`;
        }
        setOtpIdentifierType('phone');
        setFormattedPhoneForOTP(formattedPhone);
      }
      setCurrentStep('forgot-otp');
      toast.success('کد بازیابی ارسال شد');
    } catch (error: any) {
      toast.error(error.message || 'خطا در ارسال کد بازیابی');
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotPasswordOTP = async (code: string) => {
    if (code.length !== 4) return;
    setLoading(true);
    try {
      if (otpIdentifierType === 'email') {
        await rafieiAuth.verifyEmailOTP(formattedPhoneForOTP, code);
      } else {
        await rafieiAuth.verifyOTP(formattedPhoneForOTP, code, countryCode);
      }
      setCurrentStep('reset-password');
      setOtpVerified(true);
      setOtpCode('');
      toast.success('کد تأیید شد');
    } catch (error: any) {
      toast.error('خطا در تأیید کد');
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    setLoading(true);
    try {
      if (existingUser) {
        await messengerService.updateUserPassword(existingUser.id, password);
        const result = await messengerService.loginWithPassword(formattedPhoneForOTP, password);
        if (result.error) throw new Error('خطا در ورود');
        toast.success('رمز عبور تغییر یافت');
        onAuthenticated(result.session_token || '', result.user?.name || '', result.user!);
      }
    } catch (error: any) {
      toast.error('خطا در تغییر رمز عبور');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify OTP when 4 digits are entered  
  useEffect(() => {
    if (otpCode.length === 4) {
      if (currentStep === 'otp-link') {
        verifyLinkingOTP(otpCode);
      } else if (currentStep === 'otp-login') {
        verifyLoginOTP(otpCode);
      } else if (currentStep === 'forgot-otp') {
        verifyForgotPasswordOTP(otpCode);
      }
    }
  }, [otpCode, currentStep]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('🔐 Starting Google authentication...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        toast.error('خطا در ورود با Google. لطفا دوباره تلاش کنید.');
      } else {
        console.log('✅ Google auth initiated successfully');
        // The redirect will handle the rest
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('خطا در ورود با Google. لطفا دوباره تلاش کنید.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'phone': return isAcademyAuth ? 'ورود به آکادمی رفیعی' : 'ورود به پیام رسان رفیعی';
      case 'password': return isLogin ? 'ورود' : 'ایجاد رمز عبور';
      case 'name': return 'اطلاعات شما';
      case 'username': return 'انتخاب نام کاربری';
      case 'pending': return 'در انتظار تایید';
      case 'otp-link': return 'تأیید شماره تلفن';
      case 'linking': return 'ربط حساب';
      case 'name-confirm': return 'تأیید اطلاعات';
      case 'success': return 'موفقیت آمیز';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'phone': return 'شماره تلفن خود را وارد کنید';
      case 'password': return isLogin ? 'رمز عبور خود را وارد کنید' : 'رمز عبور خود را انتخاب کنید';
      case 'name': return 'نام، نام خانوادگی و ایمیل خود را وارد کنید';
      case 'username': return 'یک نام کاربری منحصر به فرد انتخاب کنید';
      case 'pending': return 'حساب شما ثبت شد و در انتظار تایید مدیریت است';
      case 'otp-link': return 'کد تأیید ارسال شد';
      case 'linking': return 'اطلاعات حساب خود را وارد کنید';
      case 'name-confirm': return 'اطلاعات خود را بررسی و تأیید کنید';
      case 'success': return 'حساب Google شما با موفقیت ربط داده شد!';
    }
  };

  if (currentStep === 'pending') {
    return (
      <Card className="w-full max-w-md border-0 shadow-none bg-background">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-normal text-foreground">{getStepTitle()}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={checkApprovalStatus}
            disabled={loading}
            className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                در حال بررسی...
              </>
            ) : (
              'بررسی وضعیت'
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep('phone')}
            className="w-full h-12 rounded-full text-muted-foreground"
          >
            برگشت
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none bg-background">
      <CardHeader className="text-center pb-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-normal text-foreground">{getStepTitle()}</CardTitle>
        <CardDescription className="text-muted-foreground mt-2">{getStepDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {currentStep === 'phone' && (
          <div className="mb-6 flex rounded-full border border-border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 h-9 rounded-full text-sm transition-colors ${authMethod === 'phone' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              شماره موبایل
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('telegram')}
              className={`flex-1 h-9 rounded-full text-sm transition-colors ${authMethod === 'telegram' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              تلگرام
            </button>
          </div>
        )}
        {currentStep === 'phone' && authMethod === 'telegram' && (
          <TelegramAuthPanel onAuthenticated={onAuthenticated} />
        )}
        {currentStep === 'phone' && authMethod === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex border-0 border-b border-border" dir="ltr">
                {!isEmailInput(phoneNumber) && (
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-20 border-0 rounded-none bg-transparent focus:ring-0 px-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       {getCountryCodeOptions().map((country, index) => (
                         <SelectItem key={`${country.code}-${index}`} value={country.code}>
                           {country.flag} {country.code}
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  id="phone"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (isEmailInput(v)) {
                      // Email mode: allow email characters, lowercase
                      v = v.replace(/\s/g, '').toLowerCase();
                    } else {
                      v = v.replace(/[^0-9a-zA-Z@._\-+]/g, '');
                      // If still purely numeric, strip leading 0 / +
                      if (/^[0-9+]+$/.test(v)) {
                        v = v.replace(/^[0+]+/, '');
                      }
                    }
                    setPhoneNumber(v);
                  }}
                  placeholder="شماره تلفن یا ایمیل"
                  required
                  dir="ltr"
                  className="flex-1 h-12 border-0 rounded-none bg-transparent px-2 focus-visible:ring-0 placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal mt-8" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                'ادامه'
              )}
            </Button>
            
            {/* Google Sign In Section - Only show if enabled */}
            {isGoogleAuthEnabled && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">یا</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  variant="outline"
                  className="w-full h-10 bg-background dark:bg-background border border-border dark:border-border hover:bg-accent dark:hover:bg-accent text-foreground dark:text-foreground rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      در حال ورود...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      ورود با Google
                    </>
                  )}
                </Button>
              </>
            )}
          </form>
        )}

        {currentStep === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {isLogin && existingUser && (
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  ورود برای: <span className="font-medium text-foreground">{existingUser.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">{countryCode}{phoneNumber}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "رمز عبور" : "رمز عبور جدید"}
                required
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
              
            </div>
            
            <div className="flex gap-3 mt-8">
              <Button type="submit" className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'در حال ورود...' : 'ادامه'}
                  </>
                ) : (
                  isLogin ? 'ورود' : 'ادامه'
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setCurrentStep('phone')}
                className="px-4 h-12 rounded-full text-muted-foreground"
              >
                برگشت
              </Button>
            </div>
            
            {/* OTP Login Option for Academy Auth */}
            {isLogin && isAcademyAuth && (
              <div className="text-center mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleOTPLogin}
                  className="text-sm text-foreground block w-full"
                >
                  ورود با کد تأیید
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('forgot-password')}
                  className="text-sm text-red-600 hover:text-red-700 block w-full"
                >
                  فراموشی رمز عبور
                </button>
              </div>
            )}
            
            {/* Forgot Password for Messenger Auth */}
            {isLogin && !isAcademyAuth && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('forgot-password')}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  فراموشی رمز عبور
                </button>
              </div>
            )}
          </form>
        )}

        {currentStep === 'password-setup' && (
          <form onSubmit={handlePasswordSetup} className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                برای: <span className="font-medium text-foreground">{existingUser?.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">{countryCode}{phoneNumber}</p>
              <p className="text-sm text-primary mt-2">لطفاً رمز عبور جدید تعین کنید</p>
            </div>
            
            <div className="space-y-2">
              <Input
                id="newPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور جدید"
                required
                minLength={6}
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">رمز عبور باید حداقل ۶ کاراکتر باشد</p>
            </div>
            
            <div className="flex gap-3 mt-8">
              <Button type="submit" className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال تنظیم...
                  </>
                ) : (
                  'تنظیم رمز عبور'
                )}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 'name' && (
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="نام"
                    required
                    dir="rtl"
                    className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="نام خانوادگی"
                    required
                    dir="rtl"
                    className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="ایمیل"
                    required
                    dir="ltr"
                    className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 pl-8 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                  />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    {emailChecking ? (
                      <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                    ) : emailAvailable === true ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : emailAvailable === false ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <Button 
                type="submit" 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
                disabled={loading || (email && emailAvailable === false)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isAcademyAuth ? 'در حال ثبت نام...' : 'ادامه'}
                  </>
                ) : (
                  isAcademyAuth ? 'ثبت نام' : 'ادامه'
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setCurrentStep('password')}
                className="px-4 h-12 rounded-full text-muted-foreground"
              >
                برگشت
              </Button>
            </div>
          </form>
        )}

        {currentStep === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="نام کاربری"
                  className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 pl-8 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                  dir="ltr"
                  required
                />
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  {usernameChecking ? (
                    <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                  ) : usernameAvailable === true ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                نام کاربری منحصر به فرد است و دیگران می‌توانند با آن شما را پیدا کنند
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                type="submit" 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
                disabled={loading || (username && !usernameAvailable)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال ثبت نام...
                  </>
                ) : (
                  'ثبت نام'
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setCurrentStep('name')}
                className="px-4 h-12 rounded-full text-muted-foreground"
              >
                برگشت
              </Button>
            </div>
          </form>
        )}

        {currentStep === 'otp-link' && (
          <div className="space-y-6">
            <div className="text-center space-y-3 mb-8">
              {/* Enhanced Animated Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                <svg className="w-10 h-10 text-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground">
                تأیید شماره تلفن
              </h3>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  کد تأیید ۴ رقمی به شماره
                </p>
                <p className="text-lg font-medium text-foreground font-mono bg-muted/30 rounded-lg py-2 px-4" dir="ltr">
                  {formattedPhoneForOTP || `${countryCode}${phoneNumber}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  ارسال شد. کد را در زیر وارد کنید
                </p>
              </div>
              
              {linkingEmail && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    </svg>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      حساب Google
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                    {linkingEmail}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced OTP Input */}
            <div className="flex justify-center mb-8">
              <InputOTP
                value={otpCode}
                onChange={setOtpCode}
                maxLength={4}
                className="gap-4"
              >
                <InputOTPGroup>
                  <InputOTPSlot 
                    index={0} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Enhanced Loading State */}
            {loading && (
              <div className="flex items-center justify-center space-x-3 mb-6 bg-primary/5 rounded-lg py-4 px-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-base text-primary font-medium">در حال تأیید کد...</span>
              </div>
            )}

            {/* Enhanced Resend Section */}
            <div className="text-center space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  کد را دریافت نکردید؟
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10 font-medium transition-all duration-200"
                  onClick={handlePhoneSubmit}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  ارسال مجدد کد
                </Button>
              </div>
            </div>

            {/* Enhanced Back Button */}
            <div className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep('phone');
                  setOtpCode('');
                  setIsGoogleLinking(false);
                  setExistingUser(null);
                  setFormattedPhoneForOTP('');
                  setOtpVerified(false);
                }}
                className="w-full h-12 rounded-full border-border hover:bg-muted/50 transition-all duration-200"
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                تغییر شماره تلفن
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'otp-login' && (
          <div className="space-y-6">
            <div className="text-center space-y-3 mb-8">
              <h3 className="text-xl font-semibold text-foreground">
                ورود با کد تأیید
              </h3>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  کد تأیید ۴ رقمی به شماره
                </p>
                <p className="text-lg font-medium text-foreground font-mono bg-muted/30 rounded-lg py-2 px-4" dir="ltr">
                  {formattedPhoneForOTP || `${countryCode}${phoneNumber}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  ارسال شد. کد را در زیر وارد کنید
                </p>
              </div>
            </div>

            {/* Enhanced OTP Input */}
            <div className="flex justify-center mb-8" dir="ltr">
              <InputOTP
                value={otpCode}
                onChange={(value) => {
                  setOtpCode(value);
                  if (value.length === 4) {
                    verifyLoginOTP(value);
                  }
                }}
                maxLength={4}
                className="gap-4"
              >
                <InputOTPGroup>
                  <InputOTPSlot 
                    index={0} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-16 h-16 text-2xl font-bold border-2 border-border rounded-xl transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 data-[has-value]:border-primary data-[has-value]:bg-primary/5 data-[has-value]:scale-105"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Enhanced Loading State */}
            {loading && (
              <div className="flex items-center justify-center space-x-3 mb-6 bg-primary/5 rounded-lg py-4 px-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-base text-primary font-medium">در حال تأیید کد...</span>
              </div>
            )}

            {/* Enhanced Resend Section */}
            <div className="text-center space-y-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-primary/10 font-medium transition-all duration-200"
                onClick={handleOTPLogin}
                disabled={loading}
              >
                ارسال مجدد کد
              </Button>
            </div>

            {/* Enhanced Back Button */}
            <div className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep('password');
                  setOtpCode('');
                  setFormattedPhoneForOTP('');
                }}
                className="w-full h-12 rounded-full border-border hover:bg-muted/50 transition-all duration-200"
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                بازگشت به ورود با رمز
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'name-confirm' && (
          <div className="space-y-6">
            <div className="text-center space-y-3 mb-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground">
                تأیید اطلاعات
              </h3>
              
              <p className="text-sm text-muted-foreground">
                اطلاعات موجود در حساب شما برای ربط حساب Google استفاده خواهد شد
              </p>
              
              {existingUser && (
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      حساب موجود
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                    {existingUser.phone}
                  </p>
                </div>
              )}
              
              {linkingEmail && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    </svg>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      حساب Google
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                    {linkingEmail}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleNameConfirmation} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="نام"
                      required
                      dir="rtl"
                      className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="نام خانوادگی"
                      required
                      dir="rtl"
                      className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <Button 
                  type="submit" 
                  className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      در حال ربط حساب...
                    </>
                  ) : (
                    'تأیید و ربط حساب'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setCurrentStep('otp-link');
                    setOtpCode('');
                  }}
                  className="px-4 h-12 rounded-full text-muted-foreground"
                  disabled={loading}
                >
                  برگشت
                </Button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'linking' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                حساب Google شما هنوز به شماره تلفنی ربط نشده است
              </p>
              {linkingEmail && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Gmail: {linkingEmail}
                </p>
              )}
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex border-0 border-b border-border" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-20 border-0 rounded-none bg-transparent focus:ring-0 px-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       {getCountryCodeOptions().map((country, index) => (
                         <SelectItem key={`${country.code}-linking-${index}`} value={country.code}>
                           {country.flag} {country.code}
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      let cleanValue = e.target.value.replace(/[^0-9]/g, '');
                      cleanValue = cleanValue.replace(/^[0+]+/, '');
                      setPhoneNumber(cleanValue);
                    }}
                    placeholder="شماره تلفن"
                    required
                    dir="ltr"
                    className="flex-1 h-12 border-0 rounded-none bg-transparent px-2 focus-visible:ring-0 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال بررسی...
                  </>
                ) : (
                  'ادامه'
                )}
              </Button>
            </form>
          </div>
        )}

        {currentStep === 'success' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-semibold text-foreground">
                🎉 موفقیت آمیز!
              </h3>
              
              <p className="text-sm text-muted-foreground">
                حساب Google شما با موفقیت ربط داده شد
              </p>
              
              <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded-lg p-4 mt-6">
                <div className="space-y-3">
                  {linkingEmail && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      </svg>
                      <div className="text-right flex-1">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">حساب Google</p>
                        <p className="text-xs text-green-600 dark:text-green-400 font-mono">{linkingEmail}</p>
                      </div>
                    </div>
                  )}
                  
                  {existingUser && (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div className="text-right flex-1">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">حساب موجود</p>
                        <p className="text-xs text-green-600 dark:text-green-400 font-mono">{existingUser.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ورود...
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'forgot-password' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">فراموشی رمز عبور</p>
              <p className="text-sm text-muted-foreground">کد بازیابی به شماره شما ارسال می‌شود</p>
              <p className="text-xs text-muted-foreground">{countryCode}{phoneNumber}</p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleForgotPasswordOTP} 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  'ارسال کد بازیابی'
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep('password')} 
                className="px-4 h-12 rounded-full text-muted-foreground"
              >
                برگشت
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'forgot-otp' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                کد بازیابی ۴ رقمی ارسال شده به شماره زیر را وارد کنید:
              </p>
              <p className="font-mono text-primary text-sm mt-2" dir="ltr">{formattedPhoneForOTP}</p>
            </div>

            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={4}
                value={otpCode}
                onChange={setOtpCode}
                disabled={loading}
                className="gap-4"
              >
                <InputOTPGroup className="gap-4">
                  {[0, 1, 2, 3].map((index) => (
                    <InputOTPSlot 
                      key={index}
                      index={index} 
                      className="w-16 h-16 text-2xl font-semibold border-2 border-border rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => verifyForgotPasswordOTP(otpCode)} 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
                disabled={loading || otpCode.length !== 4}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال تأیید...
                  </>
                ) : (
                  'تأیید کد'
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep('forgot-password')} 
                className="px-4 h-12 rounded-full text-muted-foreground"
              >
                برگشت
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'reset-password' && (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">رمز عبور جدید</p>
              <p className="text-sm text-muted-foreground">رمز عبور جدید خود را وارد کنید</p>
              <p className="text-xs text-muted-foreground">{countryCode}{phoneNumber}</p>
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
                required
                minLength={6}
                className="h-12 border-0 border-b border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال تنظیم...
                  </>
                ) : (
                  'تنظیم رمز عبور'
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setCurrentStep('forgot-otp')} 
                className="px-4 h-12 rounded-full text-muted-foreground"
              >
                برگشت
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedMessengerAuth;
