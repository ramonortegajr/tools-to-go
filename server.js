const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const path = require("path");

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

const formatCache = new Map(); // Cache for storing video formats

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/tubetogo', (req, res) => {
    res.render('tubetogo');
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
        let formats = formatCache.get(videoUrl);
        if (!formats) {
            const info = await ytdl.getInfo(videoUrl);
            formats = info.formats.filter(format => {
                return (
                    (format.itag === 137 && format.container === 'mp4' && format.qualityLabel === '1080p' &&
                        format.codecs.includes('vp9')) ||
                    (format.itag === 248 && format.container === 'webm' && format.qualityLabel === '1080p' &&
                        format.codecs.includes('vp9')) ||
                    (format.itag === 136 && format.container === 'mp4' && format.qualityLabel === '720p' &&
                        format.codecs.includes('avc1.4d4016')) ||
                    (format.itag === 247 && format.container === 'webm' && format.qualityLabel === '720p' &&
                        format.codecs.includes('vp9')) ||
                    (format.itag === 135 && format.container === 'mp4' && format.qualityLabel === '480p' &&
                        format.codecs.includes('avc1.4d4014')) ||
                    (format.itag === 18 && format.container === 'mp4' && format.qualityLabel === '360p' &&
                        format.codecs.includes('avc1.42001E') && format.audioBitrate === 96)
                );
            }).map(format => ({
                quality: format.qualityLabel,
                itag: format.itag,
                container: format.container,
                codecs: format.codecs,
                bitrate: format.bitrate,
                audioBitrate: format.audioBitrate
            }));
            formatCache.set(videoUrl, formats);
        }
        console.log('Filtered formats:', formats); // Log the formats to check the output
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
            if (!format) {
                return res.status(400).json({ error: 'Unsupported format' });
            }

            const title = info.videoDetails.title.replace(/[<>:"\/\\|?*]+/g, '');
            res.header('Content-Disposition', `attachment; filename="${title} (${quality}).${format.container}"`);

            ytdl(videoUrl, { format }).pipe(res);
        }).catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Failed to download video' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
