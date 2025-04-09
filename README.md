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

## Testing

```bash
# Run tests with type checking
npm test

# Run tests without type checking
npm run test:no-check
```

## Deployment

### Supabase Edge Functions Deployment

1. **Login to Supabase CLI**
   ```bash
   npm run supabase:deploy -- --login
   ```

2. **Link Your Project**
   ```bash
   npm run supabase:deploy -- --link --project-ref your-project-ref
   ```
   Replace `your-project-ref` with your actual Supabase project reference.

3. **Deploy Functions**
   ```bash
   # Deploy all functions
   npm run supabase:deploy:all

   # Or deploy specific functions
   npm run supabase:deploy:rate-limiter
   ```

### Environment Variables

Make sure the following environment variables are set in your Supabase project:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Project Structure

- `src/` - Frontend React application
- `supabase/functions/` - Edge Functions
  - `shared/` - Shared utilities and types
  - `create-booking/` - Booking creation endpoint
  - `confirm-payment/` - Payment confirmation endpoint
  - `rate-limiter/` - Rate limiting functionality

## License

[Your License]

## Contact

[Your Contact Information] 