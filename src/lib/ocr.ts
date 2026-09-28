import type Tesseract from 'tesseract.js'
import { parseReceiptText, type ParsedReceipt } from './parseReceipt'

type Worker = Tesseract.Worker

let workerPromise: Promise<Worker> | null = null
let currentOnProgress: ((progress: number) => void) | null = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ default: Tesseract }) =>
      Tesseract.createWorker('eng', undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text' && currentOnProgress) {
            currentOnProgress(m.progress)
          }
        },
      }),
    )
  }
  return workerPromise
}

export interface OcrResult extends ParsedReceipt {
  rawText: string
  confidence: number
}

export type ImageInput = Blob | HTMLCanvasElement | string

export async function runOcr(image: ImageInput, onProgress?: (progress: number) => void): Promise<OcrResult> {
  const worker = await getWorker()
  currentOnProgress = onProgress ?? null

  try {
    const { data } = await worker.recognize(image)
    const parsed = parseReceiptText(data.text)
    return {
      rawText: data.text,
      confidence: data.confidence,
      ...parsed,
    }
  } finally {
    currentOnProgress = null
  }
}

export async function terminateOcr() {
  if (workerPromise) {
    const worker = await workerPromise
    await worker.terminate()
    workerPromise = null
  }
}
