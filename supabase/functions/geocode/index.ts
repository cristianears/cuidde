import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  cep?: string
  address?: string
}

interface GeocodeResponse {
  lat: number
  lng: number
  formatted_address: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured')
    }

    const body: GeocodeRequest = await req.json()

    if (!body.cep && !body.address) {
      return new Response(
        JSON.stringify({ error: 'Informe cep ou address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Monta o endereço para geocodificação
    let query = ''
    if (body.cep) {
      query = `${body.cep}, Brasil`
    } else if (body.address) {
      query = body.address
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Endereço não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (data.status !== 'OK') {
      throw new Error(`Google Geocoding API error: ${data.status}`)
    }

    const result = data.results[0]
    const geocoded: GeocodeResponse = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    }

    return new Response(
      JSON.stringify(geocoded),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
