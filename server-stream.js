const express = require('express');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

const app = express();

app.get('/stream/:video', (req, res) => {
  const videoPath = path.join(__dirname, 'videos', req.params.video);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  console.log("range : " + range);

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    console.log("parts : " + parts);
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;

    console.log("chunkSize : " + chunkSize);

    const fileStream = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    fileStream.pipe(res);
  } else {
    console.log("No Range");

    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, head);
    const fileStream = fs.createReadStream(videoPath);
    const videoReadable = new stream.Readable();

    videoReadable._read = () => {};
    videoReadable.pipe(res);

    let totalChunck = 0;
    fileStream.on('data', (chunk) => {
      console.log("Stream readable chunk : " + chunk.byteLength)
      totalChunck += chunk.byteLength;
      videoReadable.push(chunk);
      console.log("totalChunck : " + totalChunck)
    });

    

    fileStream.on('end', () => {
      videoReadable.push(null);
    });
  }
});


const port = 3000;
app.listen(port, () => {
  console.log(`Streaming - Server is running on port ${port}`);
});
