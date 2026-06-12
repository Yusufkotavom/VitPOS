export function getApiDatabaseUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL is required for API database access')
  }

  return url
}

export function getApiEnv() {
  return {
    databaseUrl: getApiDatabaseUrl(),
    jwtSecret: process.env.API_JWT_SECRET ?? 'dev-secret',
    r2: {
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME ?? 'vitpos-uploads',
      publicUrl: process.env.R2_PUBLIC_URL,
    },
  }
}
