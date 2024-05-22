document.getElementById('converter-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const script = document.getElementById('video-script').value;
    alert('Video script submitted: ' + script);
});
