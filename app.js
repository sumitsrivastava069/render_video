const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();
const directoryPath = path.resolve(__dirname, 'statics', 'CCTV_Capture');
const playedVideosPath = path.resolve(__dirname, 'playedVideos.txt');

let videoFiles = [];
let playedVideos = [];

// Read the directory and store the video file names
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  videoFiles = files.filter(file => {
    const extension = path.extname(file).toLowerCase();
    return extension === '.mp4'; // Filter only .mp4 files
  });

  if (videoFiles.length === 0) {
    console.error('No video files found in directory:', directoryPath);
    return;
  }

  console.log('Video files:', videoFiles);

  // Read the played videos from the text file
  fs.readFile(playedVideosPath, 'utf8', (err, data) => {
    if (!err && data) {
      playedVideos = data.split('\n').filter(video => video.trim() !== '');
    }
    console.log('Played videos:', playedVideos);

    // Check if all videos have been played
    if (playedVideos.length === videoFiles.length) {
      console.log('All videos have been played');
      return;
    }

    // Check if there are new unplayed videos
    const unplayedVideos = videoFiles.filter(video => !playedVideos.includes(video));

    if (unplayedVideos.length === 0) {
      console.log('No new videos available');
      return;
    }

    // Start playing the first unplayed video
    const currentVideoFile = unplayedVideos[0];
    console.log('Playing video:', currentVideoFile);
  });
});

app.use('/statics', express.static('CCTV_Capture'));

app.get('/video', (req, res) => {
  if (playedVideos.length === videoFiles.length) {
    res.status(200).send('No new videos available');
    return;
  }

  const unplayedVideos = videoFiles.filter(video => !playedVideos.includes(video));

  if (unplayedVideos.length === 0) {
    res.status(200).send('No new videos available');
    return;
  }

  const currentVideoFile = unplayedVideos[0];
  const videoPath = path.join(directoryPath, currentVideoFile);

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    let start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Check if the start value is greater than the end value
    if (start > end) {
      start = 0; // Set the start value to 0 to play the entire video
    }

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }

  // Mark the current video as played
  playedVideos.push(currentVideoFile);

  // Append the played video to the text file
  fs.appendFile(playedVideosPath, currentVideoFile + '\n', err => {
    if (err) {
      console.error('Error writing played videos:', err);
    }
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
