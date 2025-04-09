import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceQuote, RoofPitchMultiplier } from '../types';
import { services, buildingMaterials, roofMaterials, roofPitchMultipliers, storiesMultipliers } from '../constants';
import { ProgressSteps } from './ProgressSteps';
import { ServiceCard } from './ServiceCard';
import { ServiceQuoteList } from './ServiceQuoteList';
import { ServiceDetailsForm } from './ServiceDetailsForm';
import { ContactForm } from './ContactForm';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';
import { History, Mail, Lock, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { AuthPrompt } from './auth/AuthPrompt';
import { SocialAuth } from './auth/SocialAuth';

function calculatePrice(
  service: Service,
  material: string,
  size: string,
  stories: string,
  roofPitch: keyof RoofPitchMultiplier
): number {
  const basePrice = service.baseRate * parseFloat(size);
  let multiplier = 1;

  if (service.materialRequired && material) {
    if (service.id === 'house') {
      multiplier *= buildingMaterials[material as keyof typeof buildingMaterials];
    } else if (service.id === 'roof') {
      multiplier *= roofMaterials[material as keyof typeof roofMaterials];
    }
  }

  if (service.id === 'house' || service.id === 'gutter') {
    multiplier *= storiesMultipliers[stories as keyof typeof storiesMultipliers];
  }

  if (service.id === 'roof') {
    multiplier *= roofPitchMultipliers[roofPitch];
  }

  const finalPrice = basePrice * multiplier;
  return Math.max(finalPrice, service.minimum);
}

function getTotalPrice(quotes: ServiceQuote[]): number | null {
  const total = quotes.reduce((sum, quote) => sum + quote.price, 0);
  return total >= Math.min(...services.map((s) => s.minimum)) ? total : null;
}

export function BookingForm() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [material, setMaterial] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [stories, setStories] = useState<'1' | '2' | '3'>('1');
  const [roofPitch, setRoofPitch] = useState<keyof RoofPitchMultiplier>('low pitch');
  const [step, setStep] = useState<number>(1);
  const [serviceQuotes, setServiceQuotes] = useState<ServiceQuote[]>([]);
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [zip, setZip] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const { showToast } = useToast();

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep(2);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && signupDisabled) {
      setSignupDisabled(false);
    }
  }, [countdown, signupDisabled]);

  const startSignupCooldown = () => {
    setSignupDisabled(true);
    setCountdown(60);
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: authEmail,
      });
      
      if (error) throw error;
      
      showToast('Confirmation email resent successfully!', 'success');
      startSignupCooldown();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowResendButton(false);

    try {
      if (isSignUp) {
        if (signupDisabled) {
          throw new Error(`Please wait ${countdown} seconds before trying again`);
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            emailRedirectTo: `${window.location.origin}`,
          }
        });

        if (error) throw error;

        if (data.user?.identities?.length === 0) {
          throw new Error('An account with this email already exists');
        }

        showToast('Please check your email to confirm your account', 'success');
        startSignupCooldown();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setShowResendButton(true);
            throw new Error('Please confirm your email address before signing in');
          }
          throw error;
        }

        showToast('Signed in successfully!', 'success');
        setShowAuthForm(false);
      }
    } catch (error: any) {
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    showToast('Signed out successfully', 'success');
  };

  const handleContinueToAuth = () => {
    setShowAuthForm(true);
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setShowAuthForm(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-4xl mx-auto p-6">
        <header className="text-center mb-12 pt-8 relative">
          <div className="mb-8">
            <img 
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets/logo.png`}
              alt="Big Cat Pressure Washing" 
              className="h-32 mx-auto"
            />
          </div>
          {session && (
            <div className="flex justify-between items-start mb-8">
              <Link
                to="/history"
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <History className="w-4 h-4" />
                Booking History
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            Professional Pressure Washing Services
          </h1>
          <p className="text-lg text-blue-700">
            Experience the Big Cat difference - bringing out the best in your property
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ProgressSteps currentStep={step} />

          {showAuthForm ? (
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                {isSignUp ? 'Create an Account' : 'Welcome Back'}
              </h2>
              
              <div className="mb-8">
                <SocialAuth redirectTo={window.location.origin} />
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </div>
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                {showResendButton && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading || signupDisabled}
                    className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {resendLoading ? (
                      <>
                        <LoadingSpinner />
                        Resending...
                      </>
                    ) : signupDisabled ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend available in {countdown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Confirmation Email
                      </>
                    )}
                  </button>
                )}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleContinueAsGuest}
                    className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue as Guest
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (isSignUp && signupDisabled)}
                    className="flex-1 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : isSignUp && signupDisabled ? (
                      `Wait ${countdown}s`
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </button>
                </div>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setShowResendButton(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Select a Service
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        isSelected={selectedService === service.id}
                        onSelect={() => handleServiceSelect(service.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && selectedService && (
                <ServiceDetailsForm
                  service={services.find((s) => s.id === selectedService)!}
                  material={material}
                  size={size}
                  stories={stories}
                  roofPitch={roofPitch}
                  onMaterialChange={setMaterial}
                  onSizeChange={setSize}
                  onStoriesChange={setStories}
                  onRoofPitchChange={setRoofPitch}
                  onCancel={() => {
                    setSelectedService(null);
                    setStep(1);
                  }}
                  onAdd={() => {
                    const service = services.find((s) => s.id === selectedService)!;
                    const quote: ServiceQuote = {
                      serviceId: selectedService,
                      material: service.materialRequired ? material : undefined,
                      size,
                      stories: service.id === 'house' || service.id === 'gutter' ? stories : undefined,
                      roofPitch: service.id === 'roof' ? roofPitch : undefined,
                      price: calculatePrice(service, material, size, stories, roofPitch),
                    };
                    setServiceQuotes([...serviceQuotes, quote]);
                    setSelectedService(null);
                    setMaterial('');
                    setSize('');
                    setStep(1);
                  }}
                />
              )}

              {serviceQuotes.length > 0 && step !== 3 && (
                <ServiceQuoteList
                  quotes={serviceQuotes}
                  onRemove={(index) => {
                    setServiceQuotes(serviceQuotes.filter((_, i) => i !== index));
                  }}
                  onContinue={() => setStep(3)}
                  showPrices={false}
                  formatPrice={(price) =>
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(price)
                  }
                  getTotalPrice={() => getTotalPrice(serviceQuotes)}
                  getServiceSummary={(quote) => {
                    const service = services.find((s) => s.id === quote.serviceId);
                    if (!service) return '';
                    let summary = `${service.name} - ${quote.size} ${service.unit}`;
                    if (quote.material) summary += ` (${quote.material})`;
                    if (quote.stories) summary += ` - ${quote.stories} stories`;
                    if (quote.roofPitch) summary += ` - ${quote.roofPitch}`;
                    return summary;
                  }}
                />
              )}

              {step === 3 && (
                <>
                  {!session && !isGuest ? (
                    <AuthPrompt
                      serviceQuotes={serviceQuotes}
                      totalPrice={getTotalPrice(serviceQuotes)!}
                      onContinueAsGuest={handleContinueAsGuest}
                    />
                  ) : (
                    <ContactForm
                      email={email}
                      phone={phone}
                      name={name}
                      address={address}
                      city={city}
                      state={state}
                      zip={zip}
                      loading={loading}
                      error={error}
                      session={session}
                      serviceQuotes={serviceQuotes}
                      onEmailChange={setEmail}
                      onPhoneChange={setPhone}
                      onNameChange={setName}
                      onAddressChange={setAddress}
                      onCityChange={setCity}
                      onStateChange={setState}
                      onZipChange={setZip}
                      onBack={() => setStep(2)}
                      formatPrice={(price) =>
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(price)
                      }
                      getTotalPrice={() => getTotalPrice(serviceQuotes)}
                      getServiceSummary={(quote) => {
                        const service = services.find((s) => s.id === quote.serviceId);
                        if (!service) return '';
                        let summary = `${service.name} - ${quote.size} ${service.unit}`;
                        if (quote.material) summary += ` (${quote.material})`;
                        if (quote.stories) summary += ` - ${quote.stories} stories`;
                        if (quote.roofPitch) summary += ` - ${quote.roofPitch}`;
                        return summary;
                      }}
                      isGuest={isGuest}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}