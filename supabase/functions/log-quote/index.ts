import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { z } from 'npm:zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define validation schema for quote service items
const serviceSchema = z.object({
  serviceType: z.string().min(1, "Service type is required"),
  size: z.number().positive("Size must be positive"),
  material: z.string().optional().nullable(),
  stories: z.number().int().positive().optional().nullable(),
  roofPitch: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
});

// Define validation schema for quote data
const quoteSchema = z.object({
  email: z.string().email("Invalid email address").optional().nullable(),
  services: z.array(serviceSchema).min(1, "At least one service is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
});

type QuoteData = z.infer<typeof quoteSchema>;

// Main function handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Validate the request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate request body
    const input: QuoteData = await req.json();
    const validatedData = quoteSchema.parse(input);

    // Prepare data for insertion
    const serviceData = validatedData.services.map(service => ({
      service_type: service.serviceType, // Store original service type identifier
      material: service.material,
      size: service.size,
      stories: service.stories,
      roof_pitch: service.roofPitch,
      price: service.price
    }));

    // Insert the quote into the database
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        email: validatedData.email || null,
        services: serviceData,
        total_amount: validatedData.totalAmount,
        timestamp: new Date().toISOString()
      })
      .select('id')
      .single();

    // Handle database errors
    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to log quote: ${error.message}`);
    }

    // Return the success response
    return new Response(
      JSON.stringify({
        success: true,
        data: { id: data.id }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );
  } catch (error) {
    console.error('Error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return new Response(
        JSON.stringify({ success: false, errors }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}); 