import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

interface SocialAuthProps {
  redirectTo?: string;
  onlyThirdParty?: boolean;
}

export function SocialAuth({ redirectTo, onlyThirdParty = false }: SocialAuthProps) {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
        style: {
          button: {
            flex: '1',
            height: '44px',
            borderRadius: '8px',
          },
          container: {
            width: '100%',
          },
        },
        className: {
          container: 'w-full',
          button: 'flex-1 h-11 rounded-lg',
        },
      }}
      providers={['google']}
      view={onlyThirdParty ? 'sign_in' : undefined}
      redirectTo={redirectTo || window.location.origin}
      showLinks={!onlyThirdParty}
      socialLayout="horizontal"
    />
  );
}