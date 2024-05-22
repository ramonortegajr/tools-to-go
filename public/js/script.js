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
