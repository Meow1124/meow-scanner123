document.addEventListener("DOMContentLoaded", async () => {
    const fileInput = document.getElementById("file-input");
    const video = document.getElementById("camera");
    const canvas = document.getElementById("qr-canvas");
    const resultText = document.getElementById("qr-result");
    const permissionSection = document.getElementById("permission-section");
    const requestPermissionBtn = document.getElementById("request-permission");

    const switchCameraBtn = document.getElementById("switch-camera");
    const toggleFlashlightBtn = document.getElementById("toggle-flashlight");
    const restartScannerBtn = document.getElementById("restart-scanner");

    let stream;
    let currentCamera = "environment";

    async function checkPermissions() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            permissionSection.style.display = "none";
            startCamera();
        } catch (err) {
            permissionSection.style.display = "block";
        }
    }

    requestPermissionBtn.addEventListener("click", async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            permissionSection.style.display = "none";
            startCamera();
        } catch (err) {
            alert("Permission denied. Please allow camera access.");
        }
    });

    function startCamera() {
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentCamera }
        }).then(mediaStream => {
            stream = mediaStream;
            video.srcObject = stream;
            video.style.display = "block";
            switchCameraBtn.classList.remove("hidden");
            toggleFlashlightBtn.classList.remove("hidden");
            restartScannerBtn.classList.remove("hidden");

            scanQRCode();
        }).catch(error => {
            console.error("Error accessing camera:", error);
        });
    }

    function scanQRCode() {
        const context = canvas.getContext("2d");

        function captureFrame() {
            if (!stream) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                resultText.innerText = "QR Code: " + code.data;
                stopCamera();
            } else {
                requestAnimationFrame(captureFrame);
            }
        }
        requestAnimationFrame(captureFrame);
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.style.display = "none";
        }
    }

    switchCameraBtn.addEventListener("click", () => {
        currentCamera = currentCamera === "environment" ? "user" : "environment";
        stopCamera();
        startCamera();
    });

    toggleFlashlightBtn.addEventListener("click", async () => {
        if (!stream) return;

        const [track] = stream.getVideoTracks();
        const capabilities = track.getCapabilities();

        if (!capabilities.torch) {
            alert("Flashlight not supported on this device.");
            return;
        }

        track.applyConstraints({ advanced: [{ torch: !track.torch }] });
    });

    restartScannerBtn.addEventListener("click", () => {
        stopCamera();
        startCamera();
    });

    fileInput.addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    resultText.innerText = "QR Code: " + code.data;
                } else {
                    resultText.innerText = "No QR code detected.";
                }
            };
        };
        reader.readAsDataURL(file);
    });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        permissionSection.style.display = "block";
    } else {
        checkPermissions();
    }
});
