# Big Cat Pressure Washing - Booking System

A modern booking system for Big Cat Pressure Washing service.

## Features

- Service selection and quote generation
- Contact information collection
- Secure payment processing with Stripe
- Customer booking management
- Admin dashboard for tracking bookings and quotes

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payment**: Stripe integration
- **Build Tool**: Vite

## Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/bigcatpressurewashing-booking.git
   cd bigcatpressurewashing-booking
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with required variables (use `.env.example` as a template)
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your API keys and credentials

5. Start the development server
   ```bash
   npm run dev
   ```

## Deployment

1. Build the application
   ```bash
   npm run build
   ```

2. Deploy to your preferred hosting service

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

## License

[Your License]

## Contact

[Your Contact Information] 