export default defineEventHandler(() => {
  return {
    ok: true,
    service: 'official-website',
    timestamp: new Date().toISOString(),
  }
})
