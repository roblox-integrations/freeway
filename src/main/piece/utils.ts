import fs from 'node:fs/promises'
import crypto from  'node:crypto'

export async function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export async function getHash (filePath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const fd = await fs.open(filePath, 'r');
    const stream = fd.createReadStream();

    const md5sum = crypto.createHash("md5");

    stream.on("data", function (data) {
      md5sum.update(data);
    });

    stream.on("error", function (err) {
      reject(err);
    });

    stream.on("end", function () {
      resolve(md5sum.digest("hex"))
    });
  })
}
