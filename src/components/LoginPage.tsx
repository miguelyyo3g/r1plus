'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  plan?: string;
  company: string;
  companyType: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const bufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToBuffer = (base64: string) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [authStep, setAuthStep] = useState<'phone_form' | 'code_form' | 'setupProfile' | 'locked'>('phone_form');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [countryPrefix, setCountryPrefix] = useState('+34');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  
  const [loginPin, setLoginPin] = useState('');
  const [tempUser, setTempUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const lastActive = localStorage.getItem('r1plus_last_active');
      const accountsStr = localStorage.getItem('r1plus_accounts');
      if (document.hidden && lastActive && accountsStr) {
        const accounts = JSON.parse(accountsStr);
        if (accounts[lastActive]) {
          setTempUser(accounts[lastActive].user);
          setAuthStep('locked');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const lastActive = localStorage.getItem('r1plus_last_active');
    const accountsStr = localStorage.getItem('r1plus_accounts');
    if (lastActive && accountsStr) {
      const accounts = JSON.parse(accountsStr);
      if (accounts[lastActive]) {
        setTempUser(accounts[lastActive].user);
        setAuthStep('locked');
      }
    }
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    
    const cleanPhone = phoneInput.replace(/\s/g, '');
    const fullPhoneNumber = `${countryPrefix}${cleanPhone}`;
    
    const accountsStr = localStorage.getItem('r1plus_accounts');
    const accounts = accountsStr ? JSON.parse(accountsStr) : {};

    if (accounts[fullPhoneNumber]) {
      setTempUser(accounts[fullPhoneNumber].user);
      setAuthStep('locked');
      setIsLoading(false);
    } else {
      try {
        const { error } = await supabase.auth.signInWithOtp({ phone: fullPhoneNumber });
        if (error) throw error;
        setAuthStep('code_form');
      } catch (err: any) {
        setLoginError(err.message || 'Error al enviar SMS');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifySms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    
    const cleanPhone = phoneInput.replace(/\s/g, '');
    const fullPhoneNumber = `${countryPrefix}${cleanPhone}`;
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone: fullPhoneNumber, token: otpCodeInput.trim(), type: 'sms' });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        const userData = {
          id: data.user.id,
          name: profile?.name || `Usuario`,
          email: profile?.email || '',
          phone: fullPhoneNumber,
          role: profile?.role || 'user_particular',
          plan: profile?.plan || 'free',
          company: profile?.company || 'Sin Empresa',
          companyType: profile?.company_type || 'client'
        };
        setTempUser(userData);
        setAuthStep('setupProfile'); 
      }
    } catch (err: any) {
      setLoginError('Código incorrecto o expirado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDay || !birthMonth) {
      setLoginError('Por favor, indica tu fecha de nacimiento.');
      return;
    }
    if (pin.length !== 4) {
      setLoginError('El PIN debe tener exactamente 4 dígitos.');
      return;
    }
    if (pin !== pinConfirm) {
      setLoginError('Los PIN no coinciden. Inténtalo de nuevo.');
      setPin('');
      setPinConfirm('');
      return;
    }

    if (tempUser && tempUser.phone) {
      const accountsStr = localStorage.getItem('r1plus_accounts');
      const accounts = accountsStr ? JSON.parse(accountsStr) : {};
      accounts[tempUser.phone] = { pin: pin, user: tempUser };
      localStorage.setItem('r1plus_accounts', JSON.stringify(accounts));
      localStorage.setItem('r1plus_last_active', tempUser.phone);
      onLoginSuccess(tempUser);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setLoginError('');
      if (!window.PublicKeyCredential) {
        setLoginError('Tu navegador o móvil no soporta huella/FaceID.');
        return;
      }

      const credentialIdStr = localStorage.getItem('r1plus_biometric_id');

      if (!credentialIdStr) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: challenge,
            rp: { name: 'r1plus', id: window.location.hostname },
            user: {
              id: userId,
              name: tempUser?.phone || 'usuario',
              displayName: tempUser?.name || 'Usuario r1plus'
            },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }], 
            authenticatorSelection: {
              authenticatorAttachment: 'platform', 
              userVerification: 'required'
            },
            timeout: 60000
          }
        });

        if (credential) {
          const base64Id = bufferToBase64((credential as any).rawId);
          localStorage.setItem('r1plus_biometric_id', base64Id);
          
          if (tempUser && tempUser.phone) {
            localStorage.setItem('r1plus_last_active', tempUser.phone);
            onLoginSuccess(tempUser);
          }
        }
      } else {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const credentialId = base64ToBuffer(credentialIdStr);

        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            rpId: window.location.hostname,
            allowCredentials: [{
              type: 'public-key',
              id: credentialId
            }],
            userVerification: 'required',
            timeout: 60000
          }
        });

        if (assertion) {
          if (tempUser && tempUser.phone) {
            localStorage.setItem('r1plus_last_active', tempUser.phone);
            onLoginSuccess(tempUser);
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'NotAllowedError') {
        setLoginError('No se pudo verificar la biometría. Usa el PIN.');
      }
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser || !tempUser.phone) return;

    const accountsStr = localStorage.getItem('r1plus_accounts');
    const accounts = accountsStr ? JSON.parse(accountsStr) : {};
    const savedAccount = accounts[tempUser.phone];

    if (savedAccount && loginPin === savedAccount.pin) {
      setLoginPin('');
      localStorage.setItem('r1plus_last_active', tempUser.phone);
      onLoginSuccess(tempUser);
    } else {
      setLoginError('PIN incorrecto');
      setLoginPin('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('r1plus_last_active'); 
    setTempUser(null);
    setPhoneInput('');
    setOtpCodeInput('');
    setPin('');
    setPinConfirm('');
    setLoginPin('');
    setAuthStep('phone_form');
  };

  const handleForgotPin = () => {
    if (tempUser && tempUser.phone) {
      const accountsStr = localStorage.getItem('r1plus_accounts');
      if (accountsStr) {
        const accounts = JSON.parse(accountsStr);
        delete accounts[tempUser.phone]; 
        localStorage.setItem('r1plus_accounts', JSON.stringify(accounts));
      }
      localStorage.removeItem('r1plus_biometric_id');
      setPhoneInput(tempUser.phone.replace('+34', ''));
    }
    handleLogout();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 select-none">
      
      {authStep === 'phone_form' && (
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="mb-6"><span className="text-4xl bg-indigo-600 text-white p-4 rounded-2xl font-black">r1</span></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso a r1plus</h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">Registro con tu número de teléfono en dos pasos. Pon tu teléfono, mete el PIN que te enviamos y estás dentro.</p>
          
          {loginError && <div className="text-rose-500 text-xs font-bold mb-4">{loginError}</div>}
          
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="flex gap-2">
              <select value={countryPrefix} onChange={e => setCountryPrefix(e.target.value)} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold focus:outline-none focus:border-indigo-500">
                <option value="+34">+34</option>
              </select>
              <input type="tel" placeholder="600 000 000" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:outline-none focus:border-indigo-500 tracking-wider" autoFocus />
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition hover:bg-indigo-700 cursor-pointer">{isLoading ? 'Conectando...' : 'Entrar'}</button>
          </form>
        </div>
      )}

      {authStep === 'code_form' && (
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Código SMS</h2>
          <p className="text-xs text-slate-500 mb-6">Hemos enviado un código a {countryPrefix}{phoneInput.replace(/\s/g, '')}</p>
          {loginError && <div className="text-rose-500 text-xs font-bold mb-4">{loginError}</div>}
          <form onSubmit={handleVerifySms} className="space-y-4">
            <input type="number" placeholder="123456" value={otpCodeInput} onChange={e => setOtpCodeInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-2xl tracking-[0.5em] focus:outline-none focus:border-indigo-500" autoFocus />
            <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg cursor-pointer">{isLoading ? 'Verificando...' : 'Verificar'}</button>
            <button type="button" onClick={() => setAuthStep('phone_form')} className="text-indigo-500 text-xs font-bold w-full mt-2 cursor-pointer">← Cambiar teléfono</button>
          </form>
        </div>
      )}

      {authStep === 'setupProfile' && (
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-1">¿Quieres que te feliciten?</h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">Pon el día y el mes</p>
          {loginError && <div className="text-rose-500 text-xs font-bold mb-4">{loginError}</div>}
          
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div className="flex gap-3">
              <input type="number" placeholder="Día" value={birthDay} onChange={e => setBirthDay(e.target.value)} min="1" max="31" className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold focus:outline-none focus:border-indigo-500" />
              <input type="number" placeholder="Mes" value={birthMonth} onChange={e => setBirthMonth(e.target.value)} min="1" max="12" className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold focus:outline-none focus:border-indigo-500" />
            </div>
            
            <div className="pt-4 border-t border-slate-100 mt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Crea un PIN (4 dígitos)</label>
              <input type="password" maxLength={4} placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-2xl tracking-[1em] focus:outline-none focus:border-indigo-500 mb-3" />
              
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Repite tu PIN</label>
              <input type="password" maxLength={4} placeholder="••••" value={pinConfirm} onChange={e => setPinConfirm(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-2xl tracking-[1em] focus:outline-none focus:border-indigo-500" />
            </div>
            
            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg cursor-pointer transition mt-2">Finalizar y Entrar</button>
          </form>
        </div>
      )}

      {authStep === 'locked' && (
        <div className="w-full max-w-sm bg-slate-800 rounded-3xl p-8 shadow-2xl text-center border border-slate-700 relative overflow-hidden">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔒</div>
          <h2 className="text-lg font-bold text-white mb-1">¡Hola de nuevo!</h2>
          <p className="text-xs text-slate-400 mb-6 font-mono">{tempUser?.phone || tempUser?.name}</p>
          
          {loginError && <div className="text-rose-400 text-xs font-bold mb-4">{loginError}</div>}
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input type="password" maxLength={4} placeholder="PIN" value={loginPin} onChange={e => setLoginPin(e.target.value)} className="w-full p-4 bg-slate-900 border border-slate-700 text-white rounded-xl text-center font-bold text-2xl tracking-[1em] focus:outline-none focus:border-indigo-500" autoFocus />
            
            <div className="flex gap-2">
              <button type="button" onClick={handleBiometricLogin} className="w-14 bg-slate-700 hover:bg-slate-600 text-white rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center text-2xl" title="Usar FaceID / Huella">
                👆
              </button>
              <button type="submit" className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg transition cursor-pointer">
                Desbloquear
              </button>
            </div>
            
            <div className="flex justify-between items-center mt-5">
               <button type="button" onClick={handleLogout} className="text-[10px] text-slate-400 hover:text-white underline transition cursor-pointer">
                 Entrar con otra cuenta
               </button>
               <button type="button" onClick={handleForgotPin} className="text-[10px] text-rose-400 hover:text-rose-300 underline transition cursor-pointer">
                 Olvidé mi PIN
               </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}