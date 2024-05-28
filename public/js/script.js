document.getElementById('converter-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const videoUrl = document.getElementById('video-url').value;
    const cogIcon = document.getElementById('cog-icon');
    cogIcon.classList.add('spin-animation');

    try {
        const response = await fetch('/get-video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: videoUrl })
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('thumbnail').src = data.thumbnail;
            document.getElementById('title').innerText = `Title: ${data.title}`;
            document.getElementById('length').innerText = `Length: ${formatDuration(data.length)}`;
            document.getElementById('video-info').style.display = 'block';

            // Fetch available formats
            const formatsResponse = await fetch('/get-video-formats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: videoUrl })
            });
            const formatsData = await formatsResponse.json();

            if (formatsResponse.ok) {
                const qualitySelect = document.getElementById('quality');
                qualitySelect.innerHTML = ''; // Clear previous options
                
                formatsData.formats.forEach(format => {
                    const option = document.createElement('option');
                    option.value = format.itag;
                    option.textContent = `${format.quality} - ${format.container}`;
                    option.dataset.quality = format.quality; // Store quality for later use
                    qualitySelect.appendChild(option);
                });
            } else {
                alert(formatsData.error);
            }
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('An error occurred while fetching video info');
    } finally {
        cogIcon.classList.remove('spin-animation');
    }
});
document.getElementById('download-button').addEventListener('click', function () {
    const videoUrl = document.getElementById('video-url').value;
    const qualitySelect = document.getElementById('quality');
    const itag = qualitySelect.value;
    const quality = qualitySelect.options[qualitySelect.selectedIndex].dataset.quality;
    const subtitles = document.getElementById('subtitles') ? '&subtitles=true' : '';
    const downloadUrl = `/download?url=${encodeURIComponent(videoUrl)}&itag=${itag}&quality=${quality}${subtitles}`;

    // Fetch the video title and other info using YouTube oEmbed API
    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`)
        .then(response => response.json())
        .then(data => {
            const videoTitle = data.title;
            const sanitizedTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${sanitizedTitle}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Error fetching video title:', error);
            alert('Failed to fetch video title. Please try again.');
        });
});

document.getElementById('thumbnail-container').addEventListener('click', function () {
    const videoUrl = document.getElementById('video-url').value;
    const videoId = new URLSearchParams(new URL(videoUrl).search).get('v');
    if (videoId) {
        const videoElement = document.createElement('iframe');
        videoElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        videoElement.style.width = '80%';
        videoElement.style.height = '80%';
        videoElement.style.borderRadius = '10px';
        videoElement.style.border = 'none';
        videoElement.allow = 'autoplay; encrypted-media';
        videoElement.allowFullscreen = true;

        const thumbnailContainer = document.getElementById('thumbnail-container');
        thumbnailContainer.innerHTML = '';
        thumbnailContainer.appendChild(videoElement);
    } else {
        alert('Invalid YouTube URL');
    }
});


// document.getElementById('download-button').addEventListener('click', function () {
//     const videoUrl = document.getElementById('video-url').value;
//     const qualitySelect = document.getElementById('quality');
//     const itag = qualitySelect.value;
//     const quality = qualitySelect.options[qualitySelect.selectedIndex].dataset.quality;
//     const downloadUrl = `/download?url=${encodeURIComponent(videoUrl)}&itag=${itag}&quality=${quality}`;

//     const a = document.createElement('a');
//     a.href = downloadUrl;
//     a.download = 'video.mp4';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
// });

// document.addEventListener('DOMContentLoaded', function () {
//     const pasteClipboardButton = document.getElementById('paste-clipboard');
//     if (pasteClipboardButton) {
//         pasteClipboardButton.addEventListener('click', function () {
//             navigator.clipboard.readText()
//                 .then(text => {
//                     document.getElementById('video-url').value = text;
//                 })
//                 .catch(err => {
//                     console.error('Failed to read clipboard contents: ', err);
//                 });
//         });
//     }
// });

function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs} hour${hrs > 1 ? 's' : ''}, ` : ''}${mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}, ` : ''}${secs} second${secs > 1 ? 's' : ''}`;
}