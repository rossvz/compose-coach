import type { ReviewRequest } from '../lib/types'

export default function ExifList({ exif }: { exif?: ReviewRequest['exif'] }) {
  if (!exif) {
    return <p className="review-meta">No EXIF metadata detected.</p>
  }

  const entries: Array<[string, string | number | undefined]> = [
    ['Camera', [exif.cameraMake, exif.cameraModel].filter(Boolean).join(' ')],
    ['Lens', exif.lensModel],
    ['Focal Length', exif.focalLengthMm ? `${exif.focalLengthMm}mm` : undefined],
    [
      'Focal Length (35mm)',
      exif.focalLength35mm ? `${exif.focalLength35mm}mm` : undefined,
    ],
    ['Aperture', exif.aperture ? `f/${exif.aperture}` : undefined],
    ['Shutter', exif.shutterSpeed],
    ['ISO', exif.iso],
    [
      'Exposure Comp',
      exif.exposureCompensation !== undefined
        ? `${exif.exposureCompensation}`
        : undefined,
    ],
    ['White Balance', exif.whiteBalance],
    ['Flash', exif.flash],
    ['Taken At', exif.takenAt ? new Date(exif.takenAt).toLocaleString() : undefined],
  ]

  const filtered = entries.filter(([, value]) => value !== undefined && value !== '')
  if (filtered.length === 0) {
    return <p className="review-meta">No EXIF metadata detected.</p>
  }

  return (
    <dl className="exif-list">
      {filtered.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
