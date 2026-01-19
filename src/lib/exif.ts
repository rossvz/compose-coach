import type { ReviewRequest } from './types'

export async function extractExifSummary(
  file: File,
): Promise<ReviewRequest['exif'] | undefined> {
  try {
    const exifr = await import('exifr')
    const data = await exifr.parse(file)
    if (!data) return undefined

    const exposureTime = data.ExposureTime ?? data.exposureTime
    let shutterSpeed: string | undefined
    if (typeof exposureTime === 'number') {
      shutterSpeed =
        exposureTime >= 1
          ? `${exposureTime.toFixed(2)}s`
          : `1/${Math.round(1 / exposureTime)}s`
    } else if (typeof exposureTime === 'string') {
      shutterSpeed = exposureTime
    }

    const aperture =
      typeof data.FNumber === 'number'
        ? Number(data.FNumber.toFixed(1))
        : typeof data.ApertureValue === 'number'
          ? Number(data.ApertureValue.toFixed(1))
          : undefined

    const whiteBalance =
      data.WhiteBalance === 0
        ? 'Auto'
        : data.WhiteBalance === 1
          ? 'Manual'
          : undefined

    const flash =
      data.Flash === 0
        ? 'No flash'
        : typeof data.Flash === 'number'
          ? 'Flash fired'
          : undefined

    const takenAt =
      data.DateTimeOriginal instanceof Date
        ? data.DateTimeOriginal.toISOString()
        : undefined

    const summary = {
      cameraMake: data.Make || data.make,
      cameraModel: data.Model || data.model,
      lensModel: data.LensModel || data.lensModel,
      focalLengthMm:
        typeof data.FocalLength === 'number'
          ? Number(data.FocalLength.toFixed(1))
          : undefined,
      focalLength35mm:
        typeof data.FocalLengthIn35mmFilm === 'number'
          ? Number(data.FocalLengthIn35mmFilm.toFixed(1))
          : undefined,
      aperture,
      shutterSpeed,
      iso:
        typeof data.ISO === 'number'
          ? data.ISO
          : typeof data.PhotographicSensitivity === 'number'
            ? data.PhotographicSensitivity
            : undefined,
      exposureCompensation:
        typeof data.ExposureCompensation === 'number'
          ? Number(data.ExposureCompensation.toFixed(2))
          : undefined,
      whiteBalance,
      flash,
      takenAt,
    }

    const hasValues = Object.values(summary).some(
      (value) => value !== undefined && value !== null && value !== '',
    )

    return hasValues ? summary : undefined
  } catch (error) {
    console.warn('EXIF parse failed', error)
    return undefined
  }
}
