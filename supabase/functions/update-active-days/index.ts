import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';

serve(async () => {
  try {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'No-op: active day tracking has been removed from the application.' 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}); 
