const fs = require('fs');
const zlib = require('zlib');

function createPng(size, r, g, b) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 2; // Color type: 2 (Truecolor RGB)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  
  const ihdrChunk = makeChunk('IHDR', ihdr);
  
  // Raw scanlines: each scanline has 1 filter byte (0 = None) + width * 3 bytes (R, G, B)
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter byte: 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Draw border / circular gradient
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const isCard = (x > width * 0.15 && x < width * 0.85 && y > height * 0.15 && y < height * 0.85);
      
      if (dist < width * 0.45) {
        if (isCard) {
          rawData[pixelOffset] = 235;     // R (parchment)
          rawData[pixelOffset + 1] = 216; // G
          rawData[pixelOffset + 2] = 184; // B
        } else {
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
        }
      } else {
        rawData[pixelOffset] = 31;
        rawData[pixelOffset + 1] = 26;
        rawData[pixelOffset + 2] = 20;
      }
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

fs.writeFileSync('public/icons/icon-192.png', createPng(192, 5, 150, 105));
fs.writeFileSync('public/icons/icon-512.png', createPng(512, 5, 150, 105));
fs.writeFileSync('public/favicon.ico', createPng(32, 5, 150, 105));
console.log('PNG icons and favicon created successfully');

