declare module 'mp4box' {
  export interface MP4VideoTrack {
    id: number
    codec: string
    movie_timescale: number
    duration: number
    nb_samples?: number
    video: { width: number; height: number }
  }

  export interface MP4Info {
    videoTracks: MP4VideoTrack[]
    duration: number
    timescale: number
  }

  export interface MP4Sample {
    is_sync: boolean
    cts: number
    dts: number
    duration: number
    timescale: number
    data: ArrayBuffer | Uint8Array
  }

  export class DataStream {
    static BIG_ENDIAN: boolean
    static LITTLE_ENDIAN: boolean
    constructor(buffer?: ArrayBuffer, byteOffset?: number, endianness?: boolean)
    endianness: boolean
    buffer: ArrayBuffer
    _dynamicSize?: boolean
  }

  export interface MP4File {
    onReady: ((info: MP4Info) => void) | null
    onError: ((error: string) => void) | null
    onSamples:
      | ((id: number, user: unknown, samples: MP4Sample[]) => void)
      | null
    appendBuffer(data: ArrayBuffer & { fileStart: number }): number
    flush(): void
    start(): void
    stop(): void
    setExtractionOptions(
      trackId: number,
      user: unknown,
      options: { nbSamples?: number },
    ): void
    getTrackById(id: number): {
      mdia?: {
        minf?: {
          stbl?: {
            stsd?: {
              entries: Array<{
                avcC?: { write: (stream: DataStream) => void }
                hvcC?: { write: (stream: DataStream) => void }
                vpcC?: { write: (stream: DataStream) => void }
                av1C?: { write: (stream: DataStream) => void }
              }>
            }
          }
        }
      }
    }
  }

  export function createFile(): MP4File
}
