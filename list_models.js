const API_KEY = 'AIzaSyBdN28BicbtykitIiOW1pDKN3u9q-C67Yg';

async function listModels() {
    const versions = ['v1', 'v1beta'];
    for (const v of versions) {
        console.log(`Checking version ${v}...`);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${API_KEY}`);
            const data = await response.json();
            if (data.models) {
                console.log(`Models for ${v}:`, data.models.map(m => m.name));
            } else {
                console.log(`No models found for ${v} or error:`, data.error?.message || data);
            }
        } catch (e) {
            console.log(`Failed for ${v}:`, e.message);
        }
    }
}

listModels();
