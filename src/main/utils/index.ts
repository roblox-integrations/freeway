import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import {Jimp} from 'jimp'
import {lookup} from 'mime-types'

export async function getHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.open(filePath, 'r')
      .then((fd) => {
        const md5sum = crypto.createHash('md5')

        const stream = fd.createReadStream()

        stream.on('error', reject)

        stream.on('data', (data) => {
          md5sum.update(data)
        })

        stream.on('end', () => {
          resolve(md5sum.digest('hex'))
        })
      })
      .catch(reject)
  })
}

export function now(): number {
  return Math.floor(Date.now() / 1000)
}

export function getMime(filePath: string, defaultMime = 'application/octet-stream'): string {
  return lookup(filePath) || defaultMime
}

export interface RbxBase64File {
  base64: string
}

export interface RbxImageBase64 {
  width: number
  height: number
  bitmap: string | number[]
}

export async function getRbxImageBitmapBase64(filePath: string, fitSize = 1024): Promise<RbxImageBase64> {
  const image = await Jimp.read(filePath)

  if (Math.max(image.width, image.height) > fitSize) {
    image.scaleToFit({w: fitSize, h: fitSize})
  }

  return {
    width: image.bitmap.width,
    height: image.bitmap.height,
    bitmap: image.bitmap.data.toString('base64'),
  }
}

export async function getRbxImageBitmap255(filePath: string): Promise<RbxImageBase64> {
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

export async function getRbxImageBitmap01(filePath: string): Promise<RbxImageBase64> {
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

export async function getRbxFileBase64(filePath: string): Promise<RbxBase64File> {
  const base64 = await fs.readFile(filePath, 'base64')
  return {base64}
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
