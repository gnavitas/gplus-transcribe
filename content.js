chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translateImage") {
        processImage(request.src);
    }
});

function injectFloatingButton() {
    if (document.getElementById('manga-translate-all-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'manga-translate-all-btn';
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 5h2V3c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2h-2v2c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5zm14 12V3H7v2h10c1.1 0 2 .9 2 2v10h2zm-4 4V7H5v14h8z"/>
        </svg>
        <span>Translate Page</span>
    `;

    btn.onclick = translateAllImages;
    document.body.appendChild(btn);
}

async function translateAllImages() {
    const images = Array.from(document.querySelectorAll('img'))
        .filter(img => {
            const rect = img.getBoundingClientRect();
            return rect.width > 300 && rect.height > 400;
        });

    if (images.length === 0) {
        alert("No manga images found on this page.");
        return;
    }

    const btn = document.getElementById('manga-translate-all-btn');
    if (btn.disabled) return;

    btn.disabled = true;
    btn.classList.add('loading');

    for (let i = 0; i < images.length; i++) {
        btn.querySelector('span').innerText = `Translating ${i + 1}/${images.length}...`;
        try {
            const success = await processImage(images[i].src, true);
            if (!success) {
                console.warn(`Skipping image ${i + 1} due to error.`);
            }
            await new Promise(r => setTimeout(r, 6000));
        } catch (e) {
            console.error("Batch error:", e);
        }
    }

    btn.disabled = false;
    btn.classList.remove('loading');
    btn.querySelector('span').innerText = "All Done!";
    setTimeout(() => {
        btn.querySelector('span').innerText = "Translate Page";
    }, 4000);
}

injectFloatingButton();

async function processImage(src, silent = false) {
    if (!silent) showLoader();

    try {
        const base64 = await imageToBase64(src);
        const response = await chrome.runtime.sendMessage({ action: "callGemini", imageData: base64 });

        if (response.success) {
            overlayTranslations(src, response.data);
            return true;
        } else {
            if (!silent) alert("Translation Error: " + response.error);
            return false;
        }
    } catch (e) {
        if (!silent) alert("Image processing failed. Error: " + e.message);
        return false;
    } finally {
        if (!silent) hideLoader();
    }
}

async function imageToBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (fetchError) {
        console.log("Fetch blocked, trying Canvas fallback...");
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
                const canvas = document.createElement("canvas");
                canvas.width = this.width;
                canvas.height = this.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(this, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.onerror = () => reject(new Error("Canvas conversion failed"));
            img.src = url;
        });
    }
}

function overlayTranslations(imgSrc, translations) {
    const targetImg = Array.from(document.querySelectorAll('img')).find(img => img.src === imgSrc);
    if (!targetImg) return;

    const existing = document.querySelector(`.manga-container-${btoa(imgSrc).substring(0, 16)}`);
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = `manga-trans-container manga-container-${btoa(imgSrc).substring(0, 16)}`;
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';

    const updatePosition = () => {
        const rect = targetImg.getBoundingClientRect();
        container.style.top = (rect.top + window.scrollY) + 'px';
        container.style.left = (rect.left + window.scrollX) + 'px';
        container.style.width = rect.width + 'px';
        container.style.height = rect.height + 'px';
    };

    updatePosition();
    const ro = new ResizeObserver(updatePosition);
    ro.observe(targetImg);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);

    translations.forEach(item => {
        const box = document.createElement('div');
        box.className = 'manga-trans-box';
        box.style.position = 'absolute';

        const margin = 1;
        box.style.left = (item.x - margin / 2) + '%';
        box.style.top = (item.y - margin / 2) + '%';
        box.style.width = (item.width + margin) + '%';
        box.style.height = (item.height + margin) + '%';
        box.style.backgroundColor = 'white';
        box.style.color = 'black';
        box.style.borderRadius = '50%';
        box.style.display = 'flex';
        box.style.alignItems = 'center';
        box.style.justifyContent = 'center';
        box.style.textAlign = 'center';
        box.style.padding = '5%';
        box.style.boxSizing = 'border-box';
        box.style.overflowWrap = 'break-word';
        box.style.wordBreak = 'break-word';

        const fontSizePercent = item.font_size || 40;
        box.style.fontSize = `calc((${item.height} * ${fontSizePercent / 100}) * 0.8vh)`;
        box.style.fontWeight = '900';
        box.style.lineHeight = '1.0';
        box.style.fontFamily = '"Anime Ace", "CC Wild Words", "Comic Sans MS", Arial, sans-serif';

        box.innerText = item.translated;
        box.title = `Original: ${item.original}`;
        container.appendChild(box);
    });

    document.body.appendChild(container);
}

function showLoader() {
    if (document.getElementById('manga-trans-loader')) return;
    const loader = document.createElement('div');
    loader.id = 'manga-trans-loader';
    loader.innerHTML = '<div class="spinner"></div><span>Translating...</span>';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('manga-trans-loader');
    if (loader) loader.remove();
}
