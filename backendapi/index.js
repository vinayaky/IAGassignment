const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const subtitle = require('subtitle');

// Initialize express and define port
const app = express();
const port = 5000;

// Use JSON and static middleware
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define /upload POST route
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    // Save video temporarily
    const reqFile=req.file.originalname
    const fileName=reqFile.split('.')[0]
    const videoPath = fileName+'.mp4';
    const audiofile=fileName+'.mp3';
    const captionfile=fileName+'.srt'
    fs.writeFileSync(videoPath, req.file.buffer);

    // Separate audio using FFmpeg
    ffmpeg(videoPath)
      .toFormat('mp3')
      .saveToFile(audiofile)
      .on('end', async () => {
        // Make API call to OpenAI Whisper for captions
        const formData = new FormData();
        formData.append('model', 'whisper-1');
        formData.append('file', fs.createReadStream(audiofile));
        formData.append('response_format','verbose_json');
        
       //write openai apikey

        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
          headers: {
            'Authorization': `Bearer Write openai api key`,
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`, 
          },
        });

      // Get transcription data
      const transcriptionData = response.data;
      if (!transcriptionData) {
        throw new Error('No transcription data');
      }
      const wordPairs = generateWordPairs(transcriptionData);
      // Ensure srtData is a string
      const srtDataStr = typeof wordPairs === 'string' ? wordPairs : JSON.stringify(wordPairs);

      // Write the SRT data to a file
      fs.writeFileSync(captionfile, srtDataStr);
      if (!fs.existsSync(captionfile)) {
        throw new Error('Failed to write SRT data to file');
      }

        // Add subtitles to video using FFmpeg
        ffmpeg()
          .input(videoPath)
          .input(captionfile)
          .complexFilter([
            '[0:v][1:s]overlay=10:main_h-overlay_h-10',
            `subtitles=filename=${fileName}.srt`,
          ])
          .output(fileName+'output.mp4')
          .on('end', () => {
            // Send download link as response
            res.json({ message: 'Processing complete', downloadLink: `/${fileName}output.mp4` });
          })
          .run();
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
function generateWordPairs(captionsData) {

// Process captionsData and generate array
  const captions = captionsData.segments; 

  const wordPairs = [];
  let currentStartTime = 0;
  let currentEndTime = 0;

  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    const words = caption.text.split(' ');
    const avgt=(caption.end-caption.start)/words.length
    
    for (let j =1; j < words.length; j += 2) {
      const firstWord = words[j];
      const secondWord = words[j + 1] || '';

      const wordPair = {
        start: currentStartTime,
        text: `${firstWord} ${secondWord}`,
        end: currentEndTime + avgt,
        break: true, // Set break flag to true for the first word in a pair
      };

      wordPairs.push(wordPair);

      currentStartTime = wordPair.end;
      currentEndTime = wordPair.end;

      // Set break flag to false for the second word in a pair
      if (j + 1 < words.length) {
        wordPair.break = false;
        currentEndTime += avgt;
      }
     
    }
  }
  return wordPairs;
}


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
