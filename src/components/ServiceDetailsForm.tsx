import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Service, RoofPitchMultiplier } from '../types';
import { buildingMaterials, roofMaterials, roofPitchMultipliers } from '../constants';
import { serviceDetailsSchema } from '../lib/validations';

interface ServiceDetailsFormProps {
  service: Service;
  material: string;
  size: string;
  stories: '1' | '2' | '3';
  roofPitch: keyof RoofPitchMultiplier;
  onMaterialChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onStoriesChange: (value: '1' | '2' | '3') => void;
  onRoofPitchChange: (value: keyof RoofPitchMultiplier) => void;
  onCancel: () => void;
  onAdd: () => void;
}

export function ServiceDetailsForm({
  service,
  material,
  size,
  stories,
  roofPitch,
  onMaterialChange,
  onSizeChange,
  onStoriesChange,
  onRoofPitchChange,
  onCancel,
  onAdd,
}: ServiceDetailsFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getMaterialOptions = () => {
    if (service.id === 'house') return Object.keys(buildingMaterials);
    if (service.id === 'roof') return Object.keys(roofMaterials);
    return [];
  };

  const validateForm = () => {
    try {
      const formData = {
        material: service.materialRequired ? material : undefined,
        size,
        stories: service.id === 'house' || service.id === 'gutter' ? stories : undefined,
        roofPitch: service.id === 'roof' ? roofPitch : undefined,
      };

      serviceDetailsSchema.parse(formData);
      setErrors({});
      onAdd();
    } catch (error: any) {
      const formattedErrors: { [key: string]: string } = {};
      error.errors.forEach((err: any) => {
        const path = err.path[0];
        formattedErrors[path] = err.message;
      });
      setErrors(formattedErrors);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          {service.name} Details
        </h2>
      </div>
      
      {service.materialRequired && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Surface Material
          </label>
          <select
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.material ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select material</option>
            {getMaterialOptions().map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
          {errors.material && (
            <p className="mt-1 text-sm text-red-600">{errors.material}</p>
          )}
        </div>
      )}

      {service.id === 'roof' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Roof Pitch
          </label>
          <select
            value={roofPitch}
            onChange={(e) => onRoofPitchChange(e.target.value as keyof RoofPitchMultiplier)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.roofPitch ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            {Object.keys(roofPitchMultipliers).map((pitch) => (
              <option key={pitch} value={pitch}>
                {pitch.charAt(0).toUpperCase() + pitch.slice(1)}
              </option>
            ))}
          </select>
          {errors.roofPitch && (
            <p className="mt-1 text-sm text-red-600">{errors.roofPitch}</p>
          )}
        </div>
      )}

      {(service.id === 'house' || service.id === 'gutter') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Stories
          </label>
          <select
            value={stories}
            onChange={(e) => onStoriesChange(e.target.value as '1' | '2' | '3')}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.stories ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="1">1 Story</option>
            <option value="2">2 Stories</option>
            <option value="3">3 Stories</option>
          </select>
          {errors.stories && (
            <p className="mt-1 text-sm text-red-600">{errors.stories}</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size ({service.unit})
        </label>
        <input
          type="number"
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.size ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={`Enter size in ${service.unit}`}
          required
        />
        {errors.size && (
          <p className="mt-1 text-sm text-red-600">{errors.size}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={validateForm}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>
    </form>
  );
}