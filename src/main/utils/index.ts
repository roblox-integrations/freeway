import {Buffer} from 'node:buffer'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import {join, normalize} from 'node:path'
import process from 'node:process'
import {is} from '@electron-toolkit/utils'
import {studioContentPath, studioPluginsPath} from '@roblox-integrations/roblox-install'
import {Jimp} from 'jimp'
import {lookup} from 'mime-types'
import OBJFile from 'obj-file-parser'

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

export interface RbxBase64Image {
  width: number
  height: number
  base64: string
}

export interface RbxBase64File {
  base64: string
}

export interface RbxMeshFace {
  material: string
  group: string
  smoothingGroup: number
  v: number[][]
}

export interface RbxMesh {
  name: string
  v: number [][]
  uv: number [][]
  vn: number [][]
  faces: RbxMeshFace[]
}

export async function getRbxImageBitmapBase64(filePath: string, fitSize = 1024): Promise<RbxBase64Image> {
  const image = await Jimp.read(filePath)

  if (Math.max(image.width, image.height) > fitSize) {
    image.scaleToFit({w: fitSize, h: fitSize})
  }

  return {
    width: image.bitmap.width,
    height: image.bitmap.height,
    base64: image.bitmap.data.toString('base64'),
  }
}

export async function getRbxMeshBase64(filePath: string): Promise<RbxBase64File> {
  if (!filePath.toLocaleLowerCase().endsWith('obj'))
    return null

  const fileContent = await fs.readFile(filePath, 'utf-8')
  const objFile = new OBJFile(fileContent)
  const obj = objFile.parse()

  const mesh = obj.models[0] // TODO MI: take the very first mesh _for now_, need a proper solution
  const v = []
  const uv = []
  const vn = []
  const faces = []

  mesh.vertices.forEach((vert: any) => {
    v.push([vert.x, vert.y, vert.z])
  })

  mesh.textureCoords.forEach((uvCoords: any) => {
    uv.push([uvCoords.u, 1 - uvCoords.v])
  })

  mesh.vertexNormals.forEach((normal: any) => {
    vn.push([normal.x, normal.y, normal.z])
  })

  mesh.faces.forEach((face: any) => {
    const verts = []
    face.vertices.forEach((vert: any) => {
      verts.push([vert.vertexIndex, vert.textureCoordsIndex, vert.vertexNormalIndex])
    })
    // TODO MI: 'material' and 'group' can be transferred from face.
    faces.push({material: '', group: '', smoothingGroup: face.smoothingGroup, v: verts})
  })

  let result: RbxMesh = {
    name: mesh.name,
    v,
    uv,
    vn,
    faces,
  }

  result = translateVertices(result)
  const resultString = JSON.stringify(result)
  return {base64: Buffer.from(resultString).toString('base64')}
}

function calcBoundingBox(mesh: RbxMesh): number[][] {
  const v = mesh.v
  let xMin = Number.MAX_VALUE
  let xMax = -Number.MAX_VALUE
  let yMin = Number.MAX_VALUE
  let yMax = -Number.MAX_VALUE
  let zMin = Number.MAX_VALUE
  let zMax = -Number.MAX_VALUE

  v.forEach((v3: number[]) => {
    xMax = Math.max(xMax, v3[0])
    xMin = Math.min(xMin, v3[0])
    yMax = Math.max(yMax, v3[1])
    yMin = Math.min(yMin, v3[1])
    zMax = Math.max(zMax, v3[2])
    zMin = Math.min(zMin, v3[2])
  })

  return [[xMin, xMax], [yMin, yMax], [zMin, zMax]]
}

function translateVertices(mesh: RbxMesh): RbxMesh {
  // bounding box
  if (mesh.v.length === 0)
    return mesh
  const box = calcBoundingBox(mesh)
  // axisTranslate = 0 - min + (max-min)/2
  const xTr = 0 - (box[0][0] + (box[0][1] - box[0][0]) / 2)
  const yTr = 0 - (box[1][0] + (box[1][1] - box[1][0]) / 2)
  const zTr = 0 - (box[2][0] + (box[2][1] - box[2][0]) / 2)

  mesh.v.forEach((v3: number[]) => {
    v3[0] = v3[0] + xTr
    v3[1] = v3[1] + yTr
    v3[2] = v3[2] + zTr
  })
  return mesh
}

export function fromRbxImage(rbxImage: RbxBase64Image) {
  const buffer = Buffer.from(rbxImage.base64, 'base64')

  return Jimp.fromBitmap({
    data: buffer,
    width: rbxImage.width,
    height: rbxImage.height,
  })
}

export async function writeRbxImage(rbxImage: RbxBase64Image, destFile: string) {
  const image = fromRbxImage(rbxImage)
  await image.write(destFile)
}

export async function writeRbxFile(rbxFile: RbxBase64File, destFile: string) {
  const buffer = Buffer.from(rbxFile.base64, 'base64')
  await fs.writeFile(destFile, buffer)
}

/*
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
*/

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

export const RESOURCES_DIR = is.dev
  ? join(__dirname, '../../resources')
  : join(process.resourcesPath, 'app.asar.unpacked/resources')

export const STUDIO_LINKS_DIR = join(join(studioContentPath(), 'freeway'))

export const STUDIO_PLUGINS_DIR = normalize(studioPluginsPath())
