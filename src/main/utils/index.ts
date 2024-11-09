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

export interface RbxBase64File {
  base64?: string
}

export interface RbxBase64Image extends RbxBase64File {
  width: number
  height: number
  p?: number[]
  bitmap?: string | number[]
}

export async function getRbxImageBase64(filePath: string): Promise<RbxBase64Image> {
  const image = await Jimp.read(filePath)

  const width = image.width
  const height = image.height
  const base64 = await getFileBase64(filePath)

  return {width, height, base64}
}

export async function getRbxImageBitmapBase64(filePath: string): Promise<RbxBase64Image> {
  const image = await Jimp.read(filePath)

  let width = image.width
  let height = image.height

  if (width > 1024 || height > 1024) { // todo MI externalize
    const scaleFactor = width > height ? width/1024 : height/1024
    width  = Math.floor(width/scaleFactor)
    height = Math.floor(height/scaleFactor)
    image.resize({ w:  width, h: height})
 }

  const bitmap = image.bitmap.data.toString('base64')

  return {width, height, bitmap}
}

export async function getRbxImageBitmap255(filePath: string): Promise<RbxBase64Image> {
  const image = await Jimp.read(filePath)

  const width = image.width
  const height = image.height
  const pixelCount = width * height

  const bitmap: number[] = Array.from({length: pixelCount * 4})

  for (let i = 0; i < image.bitmap.data.length; i++) {
    bitmap[i] = image.bitmap.data[i]
  }

  return {width, height, bitmap}
}

export async function getRbxImageBitmap01(filePath: string): Promise<RbxBase64Image> {
  const image = await Jimp.read(filePath)

  const width = image.width
  const height = image.height

  const pixelCount = width * height

  const bitmap: number[] = Array.from({length: pixelCount * 4})

  for (let i = 0; i < image.bitmap.data.length; i++) {
    bitmap[i] = image.bitmap.data[i] / 255
  }

  return {width, height, bitmap}
}

export async function getRbxBase64File(filePath: string): Promise<RbxBase64File> {
  const base64 = await fs.readFile(filePath, 'base64')
  return {base64}
}

export async function getFileBase64(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'base64')
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
