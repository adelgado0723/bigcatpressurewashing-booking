import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceQuote, RoofPitchMultiplier, Service } from '../types';
import { buildingMaterials, roofMaterials, roofPitchMultipliers, storiesMultipliers } from '../constants';
import { ProgressSteps } from './ProgressSteps';
import { ServiceCard } from './ServiceCard';
import { ServiceQuoteList } from './ServiceQuoteList';
import { ServiceDetailsForm } from './ServiceDetailsForm';
import { ContactForm } from './ContactForm';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';
import { History, Mail, Lock, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { AuthPrompt } from './AuthPrompt';
import { SocialAuth } from './auth/SocialAuth';
import { useBookingContext } from '../contexts/BookingContext';

const calculatePrice = (
  service: Service,
  material: string | undefined,
  size: string,
  stories: string | undefined,
  roofPitch: string | undefined
): number => {
  const sizeNum = parseFloat(size || '0');
  if (isNaN(sizeNum) || sizeNum <= 0) {
    return service.minimum;
  }

  let price = sizeNum * service.rate;

  if (material && service.materialMultipliers?.[material]) {
    price *= service.materialMultipliers[material];
  }

  if (stories && service.storyMultipliers?.[stories]) {
    price *= service.storyMultipliers[stories];
  }

  if (roofPitch && service.roofPitchMultipliers?.[roofPitch]) {
    price *= service.roofPitchMultipliers[roofPitch];
  }

  return Math.max(price, service.minimum);
};

function getTotalPrice(quotes: ServiceQuote[], services: Service[]): number | null {
  const total = quotes.reduce((sum, quote) => sum + quote.price, 0);
  return total >= Math.min(...services.map((s) => s.minimum)) ? total : null;
}

export const BookingForm: React.FC = () => {
  const { services, loading, error } = useBookingContext();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [stories, setStories] = useState<'1' | '2' | '3'>('1');
  const [roofPitch, setRoofPitch] = useState<'low pitch' | 'medium pitch' | 'high pitch'>('low pitch');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'auth' | 'contact'>('details');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quotes, setQuotes] = useState<ServiceQuote[]>([]);
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [zip, setZip] = useState<string>('');
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
    setSelectedService(services.find((s) => s.id === serviceId) || null);
    setStep('details');
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
    setFormLoading(true);
    setFormError(null);
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
      setFormError(error.message);
      showToast(error.message, 'error');
    } finally {
      setFormLoading(false);
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

  const handleAddService = () => {
    if (!selectedService) return;
    
    const quote: ServiceQuote = {
      serviceId: selectedService.id,
      material: selectedMaterial || undefined,
      size: size.toString(),
      stories: selectedService.name.toLowerCase().includes('roof') ? stories : undefined,
      roofPitch: selectedService.name.toLowerCase().includes('roof') ? roofPitch : undefined,
      price: calculatePrice(
        selectedService,
        selectedMaterial || undefined,
        size.toString(),
        selectedService.name.toLowerCase().includes('roof') ? stories : undefined,
        selectedService.name.toLowerCase().includes('roof') ? roofPitch : undefined
      )
    };

    setQuotes([...quotes, quote]);
    setSelectedService(null);
    setSelectedMaterial('');
    setSize('');
    setStories('1');
    setRoofPitch('low pitch');
    setStep('details');
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
            Get a free quote for our professional pressure washing services
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <ProgressSteps currentStep={step} />
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner className="w-8 h-8 text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center text-red-600">
              {error}
            </div>
          ) : (
            <>
              {step === 'details' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Select a Service
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services?.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        isSelected={selectedService?.id === service.id}
                        onSelect={() => handleServiceSelect(service.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === 'details' && selectedService && (
                <ServiceDetailsForm
                  service={selectedService}
                  material={selectedMaterial}
                  size={size}
                  stories={stories}
                  roofPitch={roofPitch}
                  onMaterialChange={setSelectedMaterial}
                  onSizeChange={setSize}
                  onStoriesChange={setStories}
                  onRoofPitchChange={setRoofPitch}
                  onCancel={() => {
                    setSelectedService(null);
                    setStep('details');
                  }}
                  onAdd={handleAddService}
                />
              )}

              {quotes.length > 0 && step !== 'contact' && (
                <ServiceQuoteList
                  quotes={quotes}
                  onRemove={(index) => {
                    setQuotes(quotes.filter((_, i) => i !== index));
                  }}
                  onContinue={() => setStep('contact')}
                  showPrices={false}
                  formatPrice={(price) =>
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(price)
                  }
                  getTotalPrice={() => getTotalPrice(quotes, services)}
                  getServiceSummary={(quote) => {
                    const service = services.find((s) => s.id === quote.serviceId);
                    if (!service) return '';
                    let summary = service.name;
                    if (quote.material) summary += ` (${quote.material})`;
                    if (quote.stories) summary += ` - ${quote.stories} stories`;
                    if (quote.roofPitch) summary += ` - ${quote.roofPitch}`;
                    return summary;
                  }}
                />
              )}

              {step === 'contact' && (
                <>
                  {!session && !isGuest ? (
                    <AuthPrompt onContinueAsGuest={handleContinueAsGuest} />
                  ) : (
                    <ContactForm
                      email={email}
                      phone={phone}
                      name={name}
                      address={address}
                      city={city}
                      state={state}
                      zip={zip}
                      loading={formLoading}
                      error={formError}
                      session={session}
                      serviceQuotes={quotes}
                      onEmailChange={setEmail}
                      onPhoneChange={setPhone}
                      onNameChange={setName}
                      onAddressChange={setAddress}
                      onCityChange={setCity}
                      onStateChange={setState}
                      onZipChange={setZip}
                      onBack={() => setStep('details')}
                      formatPrice={(price) =>
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(price)
                      }
                      getTotalPrice={() => getTotalPrice(quotes, services)}
                      getServiceSummary={(quote) => {
                        const service = services.find((s) => s.id === quote.serviceId);
                        if (!service) return '';
                        let summary = service.name;
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
};