let qrScanner;
let flashlightEnabled = false;

function startScanner() {
    if (qrScanner) {
        qrScanner.clear();
    }
    
    qrScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    qrScanner.render((decodedText) => {
        document.getElementById("result").innerText = decodedText;
        document.getElementById("pc-result").style.display = "block";
    });
}

function toggleFlashlight() {
    const videoElement = document.querySelector("video");
    const track = videoElement?.srcObject?.getVideoTracks()[0];

    if (track && track.getCapabilities().torch) {
        track.applyConstraints({ advanced: [{ torch: !flashlightEnabled }] });
        flashlightEnabled = !flashlightEnabled;
    } else {
        alert("Flashlight not supported on this device.");
    }
}

function scanFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
        Html5Qrcode.scanFile(file, true)
            .then(decodedText => {
                document.getElementById("result").innerText = decodedText;
                document.getElementById("pc-result").style.display = "block";
            })
            .catch(() => alert("Could not scan QR code from image."));
    };
    reader.readAsDataURL(file);
}

function copyResult() {
    const text = document.getElementById("result").innerText;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard: " + text);
}

// Only start scanner if it's a mobile device
if (window.innerWidth < 768) {
    startScanner();
}
