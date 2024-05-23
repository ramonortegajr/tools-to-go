const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 2000;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads'); // Folder to save downloaded videos

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Create downloads folder if it doesn't exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// Increase the timeout for the entire server
app.use((req, res, next) => {
    res.setTimeout(3600 * 1000, () => { // Set timeout to 1 hour (in milliseconds)
        console.log('Request has timed out.');
        res.status(408).send('Request Timeout');
    });
    next();
});

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.post('/get-video-info', async (req, res) => {
    const videoUrl = req.body.url;
    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const videoDetails = {
            thumbnail: info.videoDetails.thumbnails[0].url,
            title: info.videoDetails.title,
            length: info.videoDetails.lengthSeconds
        };
        res.json(videoDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;

    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[<>:"\/\\|?*]+/g, ''); // Sanitize filename
        const filePath = path.join(DOWNLOAD_DIR, `${title}.mp4`);

        const stream = ytdl(videoUrl, { quality: 'lowest' }); // Set default quality to 'lowest'

        // Pipe the video stream to a file and handle errors
        const fileStream = fs.createWriteStream(filePath);
        stream.pipe(fileStream);

        stream.on('end', () => {
            res.download(filePath, `${title}.mp4`, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Error sending file');
                }
                // Optionally delete the file after download
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                });
            });
        });

        stream.on('error', (err) => {
            console.error('Error during download:', err);
            res.status(500).send('Error during download');
        });

        fileStream.on('error', (err) => {
            console.error('Error writing file:', err);
            res.status(500).send('Error writing file');
        });

        // Increase the timeout for this specific request
        req.setTimeout(3600 * 1000); // Set timeout to 1 hour (in milliseconds)

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
