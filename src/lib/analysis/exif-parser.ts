import exifr from 'exifr';

export interface ParsedEXIF {
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    direction?: number | null;
  };
  timestamp?: string | null;
  camera?: string | null;
  make?: string | null;
  focalLength?: number | null;
  exposureTime?: number | null;
  iso?: number | null;
  orientation?: number | null;
  software?: string | null;
  raw?: Record<string, unknown>;
}

export async function parseEXIF(buffer: ArrayBuffer): Promise<ParsedEXIF | null> {
  try {
    const exif = await exifr.parse(buffer, {
      gps: true,
      tiff: true,
      exif: true,
      ifd0: true,
    });

    if (!exif) return null;

    return {
      gps:
        exif.latitude && exif.longitude
          ? {
              latitude: exif.latitude,
              longitude: exif.longitude,
              altitude: exif.GPSAltitude ?? null,
              direction: exif.GPSImgDirection ?? null,
            }
          : undefined,
      timestamp: exif.DateTimeOriginal ?? exif.CreateDate ?? null,
      camera: exif.Model ?? null,
      make: exif.Make ?? null,
      focalLength: exif.FocalLength ?? null,
      exposureTime: exif.ExposureTime ?? null,
      iso: exif.ISO ?? null,
      orientation: exif.Orientation ?? null,
      software: exif.Software ?? null,
      raw: exif as unknown as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export function hasGPSCoordinates(exif: ParsedEXIF | null): boolean {
  return !!(exif?.gps?.latitude && exif?.gps?.longitude);
}

export function formatEXIF(exif: ParsedEXIF): string {
  if (!exif) return 'No EXIF data found';

  const lines: string[] = [];

  if (exif.gps) {
    lines.push(
      `GPS: ${exif.gps.latitude.toFixed(6)}, ${exif.gps.longitude.toFixed(6)}` +
        (exif.gps.altitude ? ` (alt: ${exif.gps.altitude}m)` : '')
    );
  }
  if (exif.camera) lines.push(`Camera: ${exif.make} ${exif.camera}`.trim());
  if (exif.timestamp) lines.push(`Taken: ${exif.timestamp}`);
  if (exif.focalLength) lines.push(`Focal Length: ${exif.focalLength}mm`);
  if (exif.iso) lines.push(`ISO: ${exif.iso}`);
  if (exif.software) lines.push(`Software: ${exif.software}`);

  return lines.length > 0 ? lines.join('\n') : 'EXIF present but no useful data';
}
