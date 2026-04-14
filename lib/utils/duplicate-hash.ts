/**
 * Generates a simple hash from a job URL to detect duplicates.
 * Normalises URL by stripping query params and trailing slashes.
 */
export function generateDuplicateHash(url: string): string {
  try {
    const parsed = new URL(url)
    // Keep origin + pathname only, normalised
    const normalised = (parsed.origin + parsed.pathname)
      .toLowerCase()
      .replace(/\/+$/, '')
    return btoa(normalised).replace(/[+/=]/g, '')
  } catch {
    // If not a valid URL, hash the raw string
    return btoa(encodeURIComponent(url.toLowerCase().trim())).replace(/[+/=]/g, '')
  }
}
