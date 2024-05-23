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
            document.getElementById('length').innerText = `Length: ${data.length} seconds`;
            document.getElementById('video-info').style.display = 'block';
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('An error occurred while fetching video info');
    } finally {
        cogIcon.classList.remove('spin-animation');
    }
});

document.getElementById('download-button').addEventListener('click', async function () {
    const videoUrl = document.getElementById('video-url').value;
    const quality = document.getElementById('quality').value;
    
    const downloadUrl = `/download?url=${encodeURIComponent(videoUrl)}&quality=${quality}`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});


document.addEventListener('DOMContentLoaded', function () {
    const downloadButton = document.getElementById('download-button');
    const startDownloadButton = document.getElementById('start-download');
    const statusMessage = document.getElementById('status-message');

    pasteClipboardButton.addEventListener('click', function () {
        navigator.clipboard.readText()
            .then(text => {
                document.getElementById('video-url').value = text;
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });
    });

    downloadButton.addEventListener('click', function () {
        const videoUrl = document.getElementById('video-url').value;
        const quality = document.getElementById('quality').value;

        startDownloadButton.style.display = 'inline-block';
        statusMessage.style.display = 'block';

        fetch(`/download?url=${encodeURIComponent(videoUrl)}&quality=${quality}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to download video');
                }
                return response.text();
            })
            .then(title => {
                statusMessage.textContent = 'Video downloaded successfully';
                startDownloadButton.style.display = 'none';
                const downloadUrl = `/download?url=${encodeURIComponent(videoUrl)}&quality=${quality}`;
                
                // Create an <a> element to trigger the download
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${title}.mp4`; // Set the filename to the video title
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error(error);
                statusMessage.textContent = 'Failed to download video';
                startDownloadButton.style.display = 'none';
            });
    });
});
