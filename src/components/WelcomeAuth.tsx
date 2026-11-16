import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { IMAGES } from '../data/seedData';
import type { AppScreen, MemberAccount } from '../types/tidewise';
import { SafePhoto, TidewiseWordmark } from './StatusIndicator';

interface WelcomeAuthProps {
  screen: Extract<AppScreen, 'welcome' | 'register' | 'verify-email' | 'login' | 'forgot-password'>;
  onNavigate: (s: AppScreen) => void;
  onCompleteAuth: (member: MemberAccount) => void;
  onDemoEnter: () => void;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return 'm***@odishacoast.in';
  const head = user.slice(0, 2);
  return `${head}***@${domain}`;
}

export function WelcomeAuth({
  screen,
  onNavigate,
  onCompleteAuth,
  onDemoEnter,
}: WelcomeAuthProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingMember, setPendingMember] = useState<MemberAccount | null>(null);
  const [resentNotice, setResentNotice] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || !email.trim() || !age.trim() || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    const numAge = Number(age);
    if (Number.isNaN(numAge) || numAge < 13 || numAge > 110) {
      setErrorMsg('Please enter a valid age (13 or older).');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!consent) {
      setErrorMsg('Please accept the community privacy notice to continue.');
      return;
    }
    setPendingMember({
      id: `member-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim(),
      age: numAge,
      verified: false,
      points: 20,
      homeRegion: 'Odisha',
    });
    onNavigate('verify-email');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Enter your email and password.');
      return;
    }
    const derivedName =
      email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
      'Aarav Mohanty';
    onCompleteAuth({
      id: `member-${email.trim().toLowerCase()}`,
      fullName: derivedName,
      email: email.trim(),
      age: 24,
      verified: true,
      points: 120,
      homeRegion: 'Puri & Bhubaneswar',
    });
  };

  return (
    <div className="min-h-screen bg-[#0B253A] tide-contour-dark flex flex-col lg:grid lg:grid-cols-12">
      {/* Left / Hero Coastal Column */}
      <div className="relative lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 text-white overflow-hidden">
        <div className="relative z-10">
          <TidewiseWordmark inverted />
          <p className="mt-2 text-sm text-[#99E2D8] font-medium">
            Clean tides. Smarter communities.
          </p>
        </div>

        <div className="relative z-10 my-6 lg:my-auto max-w-lg">
          <div className="rounded-2xl overflow-hidden border border-white/15 shadow-xl mb-6 aspect-[16/9]">
            <SafePhoto
              src={IMAGES.heroCoast}
              alt="Puri Beach sunrise shoreline in Odisha"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            Spot it. Tag it. Help clean it.
          </h1>
          <p className="mt-3 text-base text-slate-200 leading-relaxed">
            Report coastal and lake litter across Puri, Chandipur, and Bhubaneswar. Confirm AI waste detection, join local cleanups, and help route municipal pickups.
          </p>
        </div>

        <div className="relative z-10 hidden lg:flex items-center gap-4 text-xs text-slate-300">
          <span>Puri Beach</span>
          <span aria-hidden="true">·</span>
          <span>Chandipur Tidal Flats</span>
          <span aria-hidden="true">·</span>
          <span>Bindusagar &amp; Bhubaneswar Lakes</span>
        </div>
      </div>

      {/* Right / Auth Surface */}
      <div className="lg:col-span-6 bg-[#F8F6F1] rounded-t-3xl lg:rounded-none p-6 sm:p-10 lg:p-14 flex items-center justify-center flex-1">
        <div className="w-full max-w-md">
          {screen === 'welcome' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#0B253A]">
                  Welcome to Tidewise
                </h2>
                <p className="mt-1.5 text-sm text-[#52677A] leading-relaxed">
                  Open to volunteers, fishers, residents, and visitors across Odisha. No invitation code or phone number required.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-white hover:bg-[#EEF3F5] text-[#0B253A] border border-[#0B253A]/15 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Log in
                </button>
              </div>

              <div className="pt-4 border-t border-[#0B253A]/10">
                <button
                  type="button"
                  onClick={onDemoEnter}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B253A]/6 hover:bg-[#0B253A]/12 text-[#0B253A] font-medium text-sm transition-colors cursor-pointer"
                >
                  Explore prototype as Aarav (Minnow Scout · 120 pts)
                </button>
              </div>
            </div>
          )}

          {screen === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  onNavigate('welcome');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A] min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div>
                <h2 className="font-display text-2xl font-bold text-[#0B253A]">
                  Create your account
                </h2>
                <p className="mt-1 text-sm text-[#52677A]">
                  Join the community in under a minute.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800" role="alert">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0B253A] mb-1.5" htmlFor="reg-name">
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Mohanty"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 text-sm text-[#0B253A]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0B253A] mb-1.5" htmlFor="reg-email">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aarav@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 text-sm text-[#0B253A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B253A] mb-1.5" htmlFor="reg-age">
                    Age
                  </label>
                  <input
                    id="reg-age"
                    type="number"
                    min={13}
                    max={110}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 text-sm text-[#0B253A] tabular-nums"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B253A] mb-1.5" htmlFor="reg-pass">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-pass"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 text-sm text-[#0B253A]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#52677A] hover:text-[#0B253A]"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#52677A]">
                  Use at least 8 characters with letters and numbers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B253A] mb-1.5" htmlFor="reg-confirm">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 text-sm text-[#0B253A]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((v) => !v)}
                    aria-label={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#52677A] hover:text-[#0B253A]"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#52677A] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#0D9488]"
                />
                <span>
                  I agree to the Tidewise Community Guidelines and Privacy Notice (reports are shared publicly without personal contact details).
                </span>
              </label>

              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Create account
              </button>

              <p className="text-center text-xs text-[#52677A]">
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    onNavigate('login');
                  }}
                  className="font-semibold text-[#0284C7] hover:underline"
                >
                  Log in
                </button>
              </p>
            </form>
          )}

          {screen === 'verify-email' && (
            <div className="space-y-5 bg-white p-6 rounded-2xl border border-[#0B253A]/10">
              <div className="w-12 h-12 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-[#0B253A]">
                  Verify your email
                </h2>
                <p className="mt-2 text-sm text-[#52677A] leading-relaxed">
                  We sent a verification link to{' '}
                  <span className="font-semibold text-[#0B253A] font-mono-tabular">
                    {maskEmail(pendingMember?.email || email)}
                  </span>
                  . Confirm it to unlock waste reporting and cleanup drives.
                </p>
              </div>

              {resentNotice && (
                <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#0D9488]/25 text-xs font-medium text-[#0F766E]">
                  Verification link resent to {maskEmail(pendingMember?.email || email)}.
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onCompleteAuth({
                      ...(pendingMember || {
                        id: 'member-new',
                        fullName: fullName || 'Community Member',
                        email: email || 'member@odishacoast.in',
                        age: Number(age) || 24,
                        points: 20,
                        homeRegion: 'Odisha',
                      }),
                      verified: true,
                    })
                  }
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  I have verified
                </button>
                <button
                  type="button"
                  onClick={() => setResentNotice(true)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EEF3F5] hover:bg-[#E1EBEF] text-[#0B253A] font-medium text-sm transition-colors cursor-pointer"
                >
                  Resend email
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="w-full min-h-[40px] text-xs font-semibold text-[#52677A] hover:text-[#0B253A]"
                >
                  Back to sign-in
                </button>
              </div>
            </div>
          )}

          {screen === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  onNavigate('welcome');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A] min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div>
                <h2 className="font-display text-2xl font-bold text-[#0B253A]">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm text-[#52677A]">
                  Log in to view your reports, points, and upcoming drives.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800" role="alert">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0B253A] mb-1.5" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav.mohanty@odishacoast.in"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 text-sm text-[#0B253A]"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0B253A]" htmlFor="login-pass">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      onNavigate('forgot-password');
                    }}
                    className="text-xs font-semibold text-[#0284C7] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-pass"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl bg-white border border-[#0B253A]/15 text-sm text-[#0B253A]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#52677A] hover:text-[#0B253A]"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Log in
              </button>

              <p className="text-center text-xs text-[#52677A]">
                New to Tidewise?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    onNavigate('register');
                  }}
                  className="font-semibold text-[#0284C7] hover:underline"
                >
                  Create account
                </button>
              </p>
            </form>
          )}

          {screen === 'forgot-password' && (
            <div className="space-y-5 bg-white p-6 rounded-2xl border border-[#0B253A]/10">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52677A] hover:text-[#0B253A]"
              >
                <ArrowLeft className="w-4 h-4" /> Back to log in
              </button>

              {!resetSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email.trim()) setResetSent(true);
                  }}
                  className="space-y-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#0B253A]">
                      Reset your password
                    </h2>
                    <p className="mt-1 text-sm text-[#52677A]">
                      Enter your account email and we will send reset instructions.
                    </p>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F8F6F1] border border-[#0B253A]/15 text-sm text-[#0B253A]"
                  />
                  <button
                    type="submit"
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0B253A] hover:bg-[#123652] text-white font-semibold text-sm cursor-pointer"
                  >
                    Send reset link
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#0B253A]">
                      Reset link sent
                    </h2>
                    <p className="mt-1 text-sm text-[#52677A]">
                      If an account matches <span className="font-medium text-[#0B253A]">{maskEmail(email)}</span>, password-reset instructions are on the way.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0D9488] text-white font-semibold text-sm cursor-pointer"
                  >
                    Return to log in
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
