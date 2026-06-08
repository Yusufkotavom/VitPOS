export function getApiDatabaseUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL is required for API database access')
  }

  return url
}
