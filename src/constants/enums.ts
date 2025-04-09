export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

export enum ServiceType {
  CONCRETE = 'Concrete Cleaning',
  HOUSE = 'House Cleaning',
  ROOF = 'Roof Cleaning',
  GUTTER = 'Gutter Cleaning'
}

export enum RoofPitch {
  LOW = 'low pitch',
  MEDIUM = 'medium pitch',
  HIGH = 'high pitch'
}

export const DEPOSIT_AMOUNT = 50;