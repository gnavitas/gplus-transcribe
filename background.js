const API_KEY = 'AIzaSyBdN28BicbtykitIiOW1pDKN3u9q-C67Yg';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translateManga",
        title: "Translate this Manga Page",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translateManga") {
        chrome.tabs.sendMessage(tab.id, { action: "translateImage", src: info.srcUrl });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "callGemini") {
        translateWithGemini(request.imageData)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function translateWithGemini(base64Image) {
    const attempts = [
        { model: 'gemini-1.5-flash', ver: 'v1' },
        { model: 'gemini-2.0-flash', ver: 'v1beta' },
        { model: 'gemini-1.5-flash-latest', ver: 'v1' }
    ];

    let lastError = "";

    for (const attempt of attempts) {
        try {
            const { model, ver } = attempt;
            const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "OCR and translate all text in this manga/manhwa page into English. Keep it simple. Use very basic English. Do not use fancy or difficult words. Return a JSON array: { 'original': 'text', 'translated': 'text', 'x': bubble_left_%, 'y': bubble_top_%, 'width': bubble_width_%, 'height': bubble_height_%, 'font_size': size_as_percentage_of_bubble_height }. Return ONLY valid JSON." },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: base64Image.split(',')[1]
                                }
                            }
                        ]
                    }]
                })
            });

            const json = await response.json();

            if (json.error) {
                lastError = `${model} (${ver}): ${json.error.message}`;
                if (json.error.code === 429) {
                    throw new Error("QUOTA_ERROR: You are translating too fast. Please Wait 60 seconds.");
                }
                continue;
            }

            if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
                let textOutput = json.candidates[0].content.parts[0].text;
                textOutput = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(textOutput);
            }
        } catch (e) {
            if (e.message.includes("QUOTA_ERROR")) throw e;
            lastError = e.message;
        }
    }

    throw new Error(lastError || "Could not connect to Gemini AI. Please check your internet or wait a moment.");
}
