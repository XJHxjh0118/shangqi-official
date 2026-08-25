export const SCROLL_VIDEO_SRC = '/videos/mg4-hero.mp4'

const LERP_TAU = 8
const SNAP = 0.002
const LRU_MAX = 24
const LEAD = 24
const WATCHDOG = 60_000

type BankFrame = { ts: number; blob: Blob }
type HardwareAccel = NonNullable<VideoDecoderConfig['hardwareAcceleration']>

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function descriptionFromTrack(
  DataStream: typeof import('mp4box').DataStream,
  file: import('mp4box').MP4File,
  trackId: number,
) {
  const trak = file.getTrackById(trackId)
  const entries = trak?.mdia?.minf?.stbl?.stsd?.entries || []
  for (const entry of entries) {
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C
    if (!box) continue
    const stream = new DataStream()
    stream._dynamicSize = true
    stream.endianness = DataStream.BIG_ENDIAN
    box.write(stream)
    return new Uint8Array(stream.buffer, 8)
  }
  return undefined
}

function nearestIndex(bank: BankFrame[], timeSec: number) {
  const t = timeSec * 1e6
  let lo = 0
  let hi = bank.length - 1
  if (hi < 0) return 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const ts = bank[mid].ts
    if (ts === t) return mid
    if (ts < t) lo = mid + 1
    else hi = mid - 1
  }
  if (lo <= 0) return 0
  if (lo >= bank.length) return bank.length - 1
  const prev = bank[lo - 1]
  const next = bank[lo]
  return Math.abs(prev.ts - t) <= Math.abs(next.ts - t) ? lo - 1 : lo
}

function sampleTimescale(sample: import('mp4box').MP4Sample) {
  return sample.timescale || 1
}

export function useVideoScrub(
  videoSrc: string,
  container: Ref<HTMLElement | null>,
  video: Ref<HTMLVideoElement | null>,
  canvas: Ref<HTMLCanvasElement | null>,
) {
  const progress = useHomeHeroProgress()
  const canvasLive = ref(false)
  const ready = ref(false)
  const reverted = ref(false)

  let bank: BankFrame[] = []
  const lru = new Map<number, ImageBitmap | null>()
  let current = 0
  let target = 0
  let dur = 0
  let raf = 0
  let lastTs = 0
  let seeking = false
  let painted = false
  let decoder: VideoDecoder | null = null
  let aborted = false
  let watchdog: ReturnType<typeof setTimeout> | null = null
  let pendingEncode = 0
  let gen = 0
  let fetchAbort: AbortController | null = null

  function getProgress() {
    const el = container.value
    if (!el) return 0
    const span = el.offsetHeight - window.innerHeight
    if (span <= 0) return 0
    return Math.min(1, Math.max(0, window.scrollY / span))
  }

  function measure() {
    progress.value = getProgress()
  }

  async function warmLRU(i: number) {
    for (let k = i - 1; k <= i + 2; k++) {
      if (k < 0 || k >= bank.length || lru.has(k)) continue
      lru.set(k, null)
      try {
        const bmp = await createImageBitmap(bank[k].blob)
        if (aborted) {
          bmp.close()
          return
        }
        lru.set(k, bmp)
      } catch {
        lru.delete(k)
      }
      while (lru.size > LRU_MAX) {
        const oldest = lru.keys().next().value
        if (oldest === undefined) break
        const bmp = lru.get(oldest)
        bmp?.close()
        lru.delete(oldest)
      }
    }
  }

  function drawFrame(timeSec: number) {
    const el = canvas.value
    const ctx = el?.getContext('2d')
    if (!el || !ctx || !bank.length) return false
    const i = nearestIndex(bank, timeSec)
    const bmp = lru.get(i)
    if (!bmp) {
      void warmLRU(i)
      return painted
    }
    const cw = el.width
    const ch = el.height
    const scale = Math.max(cw / bmp.width, ch / bmp.height)
    const w = bmp.width * scale
    const h = bmp.height * scale
    ctx.drawImage(bmp, (cw - w) / 2, (ch - h) / 2, w, h)
    painted = true
    canvasLive.value = true
    void warmLRU(i)
    return true
  }

  function fallbackSeek(timeSec: number) {
    const el = video.value
    if (!el || seeking || !dur) return
    if (Math.abs(el.currentTime - timeSec) > 0.01) {
      seeking = true
      el.currentTime = timeSec
    }
  }

  function tick(now: number) {
    const dt = Math.min(0.1, lastTs ? (now - lastTs) / 1000 : 0.016)
    lastTs = now
    const p = getProgress()
    progress.value = p
    if (dur > 0) {
      target = p * dur
      if (prefersReducedMotion()) {
        current = target
      } else {
        current += (target - current) * (1 - Math.exp(-dt * LERP_TAU))
        if (Math.abs(target - current) < SNAP) current = target
      }
      if (ready.value && !reverted.value) {
        drawFrame(current)
      } else {
        fallbackSeek(current)
      }
    }
    raf = requestAnimationFrame(tick)
  }

  async function frameToBlob(frame: VideoFrame) {
    const off = document.createElement('canvas')
    off.width = frame.displayWidth || frame.codedWidth
    off.height = frame.displayHeight || frame.codedHeight
    const ctx = off.getContext('2d')
    if (!ctx) {
      frame.close()
      return null
    }
    ctx.drawImage(frame, 0, 0)
    frame.close()
    return new Promise<Blob | null>((resolve) => {
      off.toBlob((blob) => resolve(blob), 'image/webp', 0.82)
    })
  }

  function closeDecoder() {
    try {
      decoder?.close()
    } catch {
      /* already closed */
    }
    decoder = null
  }

  async function buildBank(hw: HardwareAccel, buf: ArrayBuffer, myGen: number) {
    if (aborted || myGen !== gen) return
    if (prefersReducedMotion() || typeof VideoDecoder === 'undefined') return

    const mp4boxMod = await import('mp4box')
    const mp4box = (mp4boxMod as { default?: typeof mp4boxMod }).default || mp4boxMod
    const file = mp4box.createFile()
    let extracted = 0
    let expected = 0
    let settled = false

    await new Promise<void>((resolve, reject) => {
      let hang: ReturnType<typeof setTimeout> | null = null
      const fail = (err: unknown) => {
        if (settled) return
        settled = true
        if (hang) clearTimeout(hang)
        reject(err instanceof Error ? err : new Error(String(err)))
      }

      const finish = async () => {
        if (settled || aborted || myGen !== gen) {
          if (!settled) {
            settled = true
            if (hang) clearTimeout(hang)
            resolve()
          }
          return
        }
        try {
          await decoder?.flush()
        } catch {
          /* ignore flush errors after last sample */
        }
        const waitBlobs = () => {
          if (aborted || myGen !== gen || pendingEncode <= 0) {
            if (!settled) {
              settled = true
              if (hang) clearTimeout(hang)
              resolve()
            }
            return
          }
          setTimeout(waitBlobs, 40)
        }
        waitBlobs()
      }

      hang = setTimeout(() => fail(new Error('decode timeout')), 45_000)
      file.onError = (err) => fail(new Error(err))
      file.onReady = (info) => {
        const track = info.videoTracks[0]
        if (!track) {
          fail(new Error('no video track'))
          return
        }
        expected = track.nb_samples || 0
        const trackDur = track.duration / (track.movie_timescale || info.timescale || 1)
        if (Number.isFinite(trackDur) && trackDur > 0) dur = trackDur
        else if (!dur) dur = video.value?.duration || 0

        const description = descriptionFromTrack(
          mp4box.DataStream,
          file,
          track.id,
        )
        const config: VideoDecoderConfig = {
          codec: track.codec,
          codedWidth: track.video.width,
          codedHeight: track.video.height,
          hardwareAcceleration: hw,
          ...(description ? { description } : {}),
        }
        decoder = new VideoDecoder({
          output: (frame) => {
            if (aborted || myGen !== gen) {
              frame.close()
              return
            }
            pendingEncode += 1
            const ts = frame.timestamp
            void frameToBlob(frame).then((blob) => {
              pendingEncode -= 1
              if (!blob || aborted || myGen !== gen) return
              bank.push({ ts, blob })
              bank.sort((a, b) => a.ts - b.ts)
              ready.value = true
            })
          },
          error: (err) => fail(err),
        })
        try {
          decoder.configure(config)
        } catch (err) {
          fail(err)
          return
        }
        file.setExtractionOptions(track.id, null, { nbSamples: 50 })
        file.start()
      }
      file.onSamples = (_id, _user, samples) => {
        if (!decoder || aborted || myGen !== gen) return
        for (const sample of samples) {
          extracted += 1
          const wait = () =>
            decoder != null && decoder.decodeQueueSize + pendingEncode > LEAD
          const enqueue = () => {
            if (aborted || myGen !== gen || !decoder || settled) return
            if (wait()) {
              setTimeout(enqueue, 8)
              return
            }
            const timescale = sampleTimescale(sample)
            decoder.decode(
              new EncodedVideoChunk({
                type: sample.is_sync ? 'key' : 'delta',
                timestamp: (sample.cts * 1e6) / timescale,
                duration: (sample.duration * 1e6) / timescale,
                data: new Uint8Array(sample.data as ArrayBuffer),
              }),
            )
            if (expected > 0 && extracted >= expected) void finish()
          }
          enqueue()
        }
      }

      const media = buf.slice(0) as ArrayBuffer & { fileStart: number }
      media.fileStart = 0
      file.appendBuffer(media)
      file.flush()
      const quietFinish = () => {
        if (settled || aborted || myGen !== gen) return
        if (extracted === 0 || (expected > 0 && extracted < expected)) {
          setTimeout(quietFinish, 400)
          return
        }
        void finish()
      }
      setTimeout(quietFinish, 800)
    })

    bank.sort((a, b) => a.ts - b.ts)
    if (bank.length) {
      ready.value = true
      drawFrame(current)
    }
  }

  async function startBank() {
    if (prefersReducedMotion() || typeof VideoDecoder === 'undefined') return
    fetchAbort = new AbortController()
    let buf: ArrayBuffer
    try {
      const res = await fetch(videoSrc, { signal: fetchAbort.signal })
      if (!res.ok) throw new Error('video fetch failed')
      buf = await res.arrayBuffer()
    } catch {
      reverted.value = true
      canvasLive.value = false
      return
    }

    const tryHw = async (hw: HardwareAccel) => {
      const myGen = ++gen
      closeDecoder()
      bank = []
      ready.value = false
      pendingEncode = 0
      await buildBank(hw, buf, myGen)
      if (!bank.length) throw new Error('empty bank')
    }

    try {
      await tryHw('prefer-hardware')
    } catch {
      if (aborted) return
      try {
        await tryHw('prefer-software')
      } catch {
        reverted.value = true
        canvasLive.value = false
      }
    }
  }

  onMounted(() => {
    const el = video.value
    const onSeeked = () => {
      seeking = false
    }
    const onMeta = () => {
      if (!dur) dur = el?.duration || 0
    }
    if (el) {
      el.addEventListener('seeked', onSeeked)
      el.addEventListener('loadedmetadata', onMeta)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    raf = requestAnimationFrame(tick)

    const boot = () => {
      if (aborted) return
      watchdog = setTimeout(() => {
        if (!painted) {
          reverted.value = true
          canvasLive.value = false
        }
      }, WATCHDOG)
      void startBank()
    }
    if (document.readyState === 'complete') boot()
    else window.addEventListener('load', boot, { once: true })
  })

  onBeforeUnmount(() => {
    aborted = true
    gen += 1
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', measure)
    window.removeEventListener('orientationchange', measure)
    fetchAbort?.abort()
    if (watchdog) clearTimeout(watchdog)
    closeDecoder()
    for (const bmp of lru.values()) bmp?.close()
    lru.clear()
    progress.value = 0
  })

  return { progress, canvasLive }
}
