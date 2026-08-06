import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import exifr from 'exifr';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are RQVEN, an advanced OSINT image geolocation analyst. You analyze images to determine where they were taken.

When analyzing an image, examine EVERY visible detail:

1. TEXT & LANGUAGE: Street signs, store names, billboards, vehicle text, license plates, any writing. Identify languages and scripts.

2. ARCHITECTURE: Building styles, roof types, window patterns, construction materials, balcony designs, building heights, urban density.

3. INFRASTRUCTURE: Road markings, traffic lights (style/color), utility poles, power lines, street furniture, guard rails, road surfaces, sidewalks, public transport.

4. VEGETATION: Tree types (palm, conifer, deciduous), grass, gardens, agricultural patterns. Estimate climate zone.

5. TERRAIN: Mountains, rivers, coastlines, deserts, valleys, elevation clues.

6. VEHICLES: Car brands/models common in specific regions, which side of road driven on, license plate styles.

7. CULTURAL: Clothing, signs in specific scripts, religious symbols, food, shop types.

8. LIGHTING & WEATHER: Sun angle (estimate latitude from shadow), cloud patterns, atmospheric haze, golden hour.

9. MATHEMATICAL: Estimate building heights, road widths, distances using known object sizes (cars ~4.5m, doors ~2m, people ~1.7m, traffic lanes ~3.7m). Calculate sun angle from shadows.

10. BRANDS & LOGOS: International vs regional brands, restaurant chains, telecom logos, bank signs.

Provide your analysis as structured JSON. Be specific. Reference which evidence led to each conclusion. Never guess without evidence.

Return ONLY valid JSON (no markdown, no code fences) matching this schema:
{
  "exif_note": "string about any EXIF data if provided, or null",
  "ocr": {
    "texts": ["detected text 1", "detected text 2"],
    "languages": ["detected language"],
    "signs": ["street sign text"],
    "brands": ["brand names detected"],
    "addresses": ["any address text"]
  },
  "landmarks": [
    {"name": "landmark name", "confidence": 0.85, "type": "natural|building|monument|bridge|infrastructure|brand", "description": "details"}
  ],
  "architecture": {
    "style": "architectural style",
    "likely_region": "region where this style is common",
    "features": ["feature1", "feature2"],
    "era": "time period if identifiable",
    "materials": ["material1", "material2"]
  },
  "vegetation": {
    "types": ["tree/plant types"],
    "density": "sparse|moderate|dense|tropical",
    "season": "estimated season",
    "climate_hint": "climate zone suggestion"
  },
  "weather": {
    "condition": "clear|cloudy|overcast|rainy|foggy|snowy",
    "time_of_day": "morning|midday|afternoon|evening|night",
    "estimated_season": "season"
  },
  "mathematical": {
    "estimated_building_height_m": {"value": 15, "method": "how calculated"},
    "estimated_road_width_m": {"value": 7, "method": "how calculated"},
    "sun_angle_degrees": {"value": 45, "method": "how calculated"},
    "shadow_direction": {"value": 180, "method": "degrees from north", "method": "how calculated"},
    "estimated_camera_height_m": {"value": 1.7, "method": "how calculated"}
  },
  "location_estimate": {
    "country": "country name",
    "region": "state/province/region",
    "city": "city name or Unknown",
    "neighborhood": "neighborhood or null",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "confidence": {
    "country": 0.95,
    "region": 0.85,
    "city": 0.70,
    "neighborhood": 0.45,
    "coordinates": 0.60
  },
  "candidates": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "country": "United States",
      "region": "New York",
      "city": "New York City",
      "confidence": 0.80,
      "reasons": ["reason 1", "reason 2"]
    }
  ],
  "evidence": [
    {
      "category": "exif|ocr|landmark|architecture|vegetation|weather|mathematical|cultural",
      "description": "short description",
      "influence": "strong|moderate|weak",
      "detail": "full explanation of how this influenced the estimate"
    }
  ],
  "reasoning": "Full paragraph explaining the complete reasoning chain from evidence to conclusion",
  "detected_language": "primary language detected",
  "cultural_indicators": ["cultural observation 1", "cultural observation 2"]
}`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract EXIF data
    let exifData: Record<string, unknown> | null = null;
    try {
      // NEW
const exif = await exifr.parse(buffer, {
  gps: true,
  tiff: true,
  exif: true,
  ifd0: {},
});
      if (exif) {
        exifData = {
          ...(exif.latitude && exif.longitude
            ? {
                gps: {
                  latitude: exif.latitude,
                  longitude: exif.longitude,
                  altitude: exif.GPSAltitude ?? null,
                },
              }
            : {}),
          timestamp: exif.DateTimeOriginal ?? exif.CreateDate ?? null,
          camera: exif.Model ?? null,
          make: exif.Make ?? null,
          focalLength: exif.FocalLength ?? null,
          exposureTime: exif.ExposureTime ?? null,
          iso: exif.ISO ?? null,
          orientation: exif.Orientation ?? null,
          software: exif.Software ?? null,
        };
      }
    } catch {
      // EXIF extraction failed, continue without it
    }

    // Use Google Gemini 2.0 Flash (free, has vision)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const base64Image = buffer.toString('base64');

    const userText = exifData
      ? `Analyze this image for geolocation. Here is the extracted EXIF data for reference:\n${JSON.stringify(exifData, null, 2)}\n\nNote: GPS coordinates in EXIF should be used as confirmed data if available. Focus your visual analysis on confirming or refining the location.`
      : 'Analyze this image for geolocation. No EXIF data was found. Rely entirely on visual analysis.';

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: file.type,
          data: base64Image,
        },
      },
      { text: userText },
    ]);

    const responseText = result.response.text();

    let analysis;
    try {
      // Gemini with responseMimeType=json should return clean JSON
      analysis = JSON.parse(responseText);
    } catch {
      // Fallback: try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          { error: 'Failed to parse AI analysis', raw: responseText },
          { status: 502 }
        );
      }
      analysis = JSON.parse(jsonMatch[0]);
    }

    // Map the analysis to our standard output format
    const output = {
      exif: exifData,
      ocr: analysis.ocr
        ? {
            text: (analysis.ocr.texts || []).join(' '),
            language: analysis.ocr.languages?.[0],
            confidence: 0.85,
            regions: [
              ...(analysis.ocr.signs || []).map((t: string) => ({ text: t, type: 'sign' as const })),
              ...(analysis.ocr.brands || []).map((t: string) => ({ text: t, type: 'brand' as const })),
              ...(analysis.ocr.addresses || []).map((t: string) => ({ text: t, type: 'address' as const })),
            ],
          }
        : null,
      landmarks: (analysis.landmarks || []).map((l: Record<string, unknown>) => ({
        name: l.name,
        confidence: l.confidence,
        type: l.type,
        description: l.description,
      })),
      architecture: analysis.architecture
        ? {
            style: analysis.architecture.style,
            region: analysis.architecture.likely_region,
            features: analysis.architecture.features || [],
            era: analysis.architecture.era,
            materials: analysis.architecture.materials || [],
          }
        : null,
      vegetation: analysis.vegetation
        ? {
            types: analysis.vegetation.types || [],
            density: analysis.vegetation.density,
            season: analysis.vegetation.season,
            health: analysis.vegetation.density === 'tropical' ? 'lush' : 'normal',
          }
        : null,
      weather: analysis.weather
        ? {
            condition: analysis.weather.condition,
            temperature: undefined,
            humidity: undefined,
            visibility: undefined,
          }
        : null,
      mathematical: analysis.mathematical
        ? {
            estimatedBuildingHeight: analysis.mathematical.estimated_building_height_m
              ? { value: analysis.mathematical.estimated_building_height_m.value, unit: 'm', method: analysis.mathematical.estimated_building_height_m.method }
              : undefined,
            estimatedRoadWidth: analysis.mathematical.estimated_road_width_m
              ? { value: analysis.mathematical.estimated_road_width_m.value, unit: 'm', method: analysis.mathematical.estimated_road_width_m.method }
              : undefined,
            sunAngle: analysis.mathematical.sun_angle_degrees
              ? { value: analysis.mathematical.sun_angle_degrees.value, unit: 'deg', method: analysis.mathematical.sun_angle_degrees.method }
              : undefined,
            shadowDirection: analysis.mathematical.shadow_direction
              ? { value: typeof analysis.mathematical.shadow_direction === 'object' ? analysis.mathematical.shadow_direction.value : analysis.mathematical.shadow_direction, unit: 'deg', method: typeof analysis.mathematical.shadow_direction === 'object' ? analysis.mathematical.shadow_direction.method : 'estimated' }
              : undefined,
            cameraElevation: analysis.mathematical.estimated_camera_height_m
              ? { value: analysis.mathematical.estimated_camera_height_m.value, unit: 'm', method: analysis.mathematical.estimated_camera_height_m.method }
              : undefined,
          }
        : null,
      confidence: analysis.confidence || {
        country: 0.5,
        region: 0.3,
        city: 0.2,
        neighborhood: 0.1,
        coordinates: 0.15,
      },
      estimate: analysis.location_estimate || {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        latitude: 0,
        longitude: 0,
      },
      candidates: (analysis.candidates || []).map((c: Record<string, unknown>) => ({
        latitude: c.latitude,
        longitude: c.longitude,
        country: c.country,
        region: c.region,
        city: c.city,
        confidence: c.confidence,
        reasons: c.reasons || [],
      })),
      evidence: (analysis.evidence || []).map((e: Record<string, unknown>, i: number) => ({
        id: `evidence-${i}`,
        category: e.category,
        description: e.description,
        influence: e.influence,
        detail: e.detail,
      })),
      reasoning: analysis.reasoning || '',
      detectedLanguage: analysis.detected_language,
      timeOfDay: analysis.weather?.time_of_day,
      estimatedSeason: analysis.weather?.estimated_season,
    };

    return NextResponse.json(output);
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
