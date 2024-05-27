const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const PORT = process.env.PORT || 3000;

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

app.post('/get-video-formats', async (req, res) => {
    const videoUrl = req.body.url;
    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const formats = info.formats
            .filter(format => format.container === 'mp4' && format.qualityLabel) // Filter out non-mp4 formats and those without a quality label
            .map(format => ({
                quality: format.qualityLabel,
                itag: format.itag,
                container: format.container
            }));
        res.json({ formats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video formats' });
    }
});

app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const itag = req.query.itag;
    const quality = req.query.quality;

    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        ytdl.getInfo(videoUrl).then(info => {
            const format = ytdl.chooseFormat(info.formats, { quality: itag });
            const title = info.videoDetails.title.replace(/[<>:"\/\\|?*]+/g, ''); // Sanitize filename
            res.header('Content-Disposition', `attachment; filename="${title} (${quality}).${format.container}"`);
            
            // Stream the video in the selected format
            ytdl(videoUrl, { format }).pipe(res);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
