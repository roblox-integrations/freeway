import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import {Jimp} from 'jimp'
import {lookup} from 'mime-types'

export async function getHash(filePath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const fd = await fs.open(filePath, 'r')
    const stream = fd.createReadStream()

    const md5sum = crypto.createHash('md5')

    stream.on('data', (data) => {
      md5sum.update(data)
    })

    stream.on('error', (err) => {
      reject(err)
    })

    stream.on('end', () => {
      resolve(md5sum.digest('hex'))
    })
  })
}

export function now(): number {
  return Math.floor(Date.now() / 1000)
}

export function getMime(filePath: string, defaultMime = 'application/octet-stream'): string {
  return lookup(filePath) || defaultMime
}

// RbxArray encodes pixel rgb as floats form 0 to 1, and has form: [ p1.r, p1.g, p1.b, p1.a, p2.r, ... ]
export interface RbxImage {
  h: number
  w: number
  p: number[]
}

export async function dumpToRbxImage(imagePath: string, round = 0): Promise<RbxImage> {
  const image = await Jimp.read(imagePath)

  image.bitmap.data

  const w = image.width
  const h = image.height
  const pixelCount = w * h

  const p = Array.from({length: pixelCount * 4})

  for (let i = 0; i < image.bitmap.data.length; i++) {
    p[i] = image.bitmap.data[i] / 255

    if (round) {
      const pow = 10 ** (round || 0)
      const n = (p[i] * pow) * (1 + Number.EPSILON)
      p[i] = Math.round(n) / pow
    }
  }

  return {h, w, p}
}

export async function dumpToRbxMesh(objectPath: string): Promise<string> {
  return fs.readFile(objectPath, 'utf-8')
}

export function randomString(length: number, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
  let result = ''
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

/*
import {createReadStream} from 'fs';
import {PNG} from 'pngjs';
export function imageToRbxImagePngjs(imagePath: string): Promise<RbxImage> {
  return new Promise((resolve, reject) => {
    createReadStream(imagePath)
      .pipe(new PNG())
      .on('parsed', function () {
        const w = this.width;
        const h = this.height;
        const pixelCount = w * h;
        const p = new Array<number>(pixelCount * 4);

        for (let i = 0; i < this.data.length; i++) {
          p[i] = this.data[i] / 255;
        }

        resolve({h, w, p})
      })
      .on('error', reject);
  });
}
*/
