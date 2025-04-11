import { Mail, Phone, User, MapPin } from 'lucide-react';

interface ContactInfoFormProps {
  email: string;
  phone: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  validationErrors: { [key: string]: string };
  disabled: boolean;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipChange: (value: string) => void;
}

export function ContactInfoForm({
  email,
  phone,
  name,
  address,
  city,
  state,
  zip,
  validationErrors,
  disabled,
  onEmailChange,
  onPhoneChange,
  onNameChange,
  onAddressChange,
  onCityChange,
  onStateChange,
  onZipChange,
}: ContactInfoFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </div>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
            required
            disabled={disabled}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone (Optional)
            </div>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(123) 456-7890"
            disabled={disabled}
          />
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Name (Optional)
          </div>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validationErrors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Your name"
          disabled={disabled}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Service Location</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Street Address
            </div>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="123 Main St"
            required
            disabled={disabled}
          />
          {validationErrors.address && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="City"
              required
              disabled={disabled}
            />
            {validationErrors.city && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.state ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="State"
              required
              disabled={disabled}
            />
            {validationErrors.state && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => onZipChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.zip ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ZIP"
              required
              disabled={disabled}
            />
            {validationErrors.zip && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.zip}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}