# Manga & Manhwa Translator Extension

A powerful Chrome extension that uses Gemini AI to automatically perform OCR and translate raw Manga and Manhwa pages into English. It overlays the translated text directly onto the original images in-place.

## Features

*   **In-Place Translation**: Overlays English translations directly on top of the original image bubbles without altering the layout.
*   **Batch Translation**: Includes a "Translate Page" floating button to automatically detect and translate all manga pages on the current webpage.
*   **Context Menu Integration**: Right-click on any image to quickly translate a specific page.
*   **Powered by Gemini AI**: Utilizes Google's Gemini Flash models (1.5 Flash, 2.0 Flash) for fast and accurate OCR and translation.
*   **Smart Rate Limiting**: Built-in 6-second delays during batch translation to respect free-tier API quotas.
*   **Responsive Overlays**: Translations adapt automatically to image resizing and window scrolling.

## Installation

Since this is an unpacked extension, you will need to load it manually in developer mode:

1.  Clone this repository or download the source code.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** using the toggle switch in the top right corner.
4.  Click the **Load unpacked** button in the top left.
5.  Select the directory where you extracted the extension's files.

## Usage

1.  Navigate to any website hosting raw manga or manhwa.
2.  **Single Page Translation**: Right-click on a manga page and select "Translate this Manga Page" from the context menu.
3.  **Full Chapter Translation**: Click the floating "Translate Page" button that appears on the screen. The extension will automatically find all large images and translate them one by one.

## How it Works

1.  The extension grabs the image source and converts it to Base64 (using a canvas fallback for CORS protection).
2.  It sends the image to the Gemini API with a prompt to perform OCR, translate the text to simple English, and detect the bounding boxes of the text bubbles.
3.  It receives the coordinates and text back in JSON format.
4.  It dynamically generates CSS-styled DOM elements and absolute-positions them over the image matching the original speech bubbles.

## API Key Setup

The extension uses an API key stored in `background.js`. For extended usage or to avoid rate limits, it is highly recommended to replace it with your own Google Gemini API key:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Open `background.js` and replace the `API_KEY` variable at the top of the file with your new key.

## Permissions Used

*   `activeTab` & `content_scripts`: Required to inject the translation UI and extract images from the active webpage.
*   `contextMenus`: Required to add the right-click translation option.
*   `host_permissions`: Required to communicate securely with the Google Generative Language API endpoint.

## License

MIT License
