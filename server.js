const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('ytdl-core');
const serverless = require('serverless-http');
const app = express();
const PORT = process.env.PORT || 1000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

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
        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);

        // Stream the video directly from YouTube to the client
        ytdl(videoUrl, { quality: 'lowest' }).pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports.handler = serverless(app);