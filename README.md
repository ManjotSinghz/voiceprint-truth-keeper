# Voiceprint Truth Keeper

Yahan ek detailed prompt hai jo aap directly Lovable mein paste kar sakte hain:



```

Build a web app called "VoiceGuard AI" — a deepfake/AI-generated voice 

detector designed to help users identify potential scam calls where 

the caller's voice might be AI-cloned.



CORE FUNCTIONALITY:

1. An audio upload feature where users can upload a voice recording 

   (.mp3, .wav, .m4a) to analyze

2. A "Live Mic Test" feature that records audio directly from the 

   browser microphone using the Web Audio API / MediaRecorder API, 

   in short continuous chunks (2-3 seconds each)

3. After analysis, show a result card with:

   - A confidence score/percentage (e.g. "78% likely AI-generated")

   - A clear visual indicator: green for "Likely Real", red/amber 

     for "Likely AI-generated"

   - A simple explanation of which signals contributed (e.g. 

     "unnatural pitch consistency detected", "spectral artifacts 

     found in high frequencies")

4. A waveform/spectrogram visualization of the uploaded audio 

   (visual only, doesn't need to be scientifically exact)

5. A history/log page showing past analyzed clips with their results 

   and timestamps



PAGES NEEDED:

- Landing page: explains the problem (AI voice scam calls), how the 

  tool helps, and a prominent "Try it now" CTA

- Analyze page: the core upload/mic-record + results interface

- History page: past scan results

- About/How it works page: simple explanation of the detection 

  approach (mention MFCC, spectrogram analysis, pitch/prosody 

  analysis in plain language, not overly technical)



DESIGN STYLE:

- Clean, trustworthy, security-app aesthetic — think fintech/security 

  dashboard feel, not playful

- Dark mode friendly

- Use a calm color palette with clear red/green/amber signal colors 

  reserved only for result states

- Mobile responsive since users may test this during an actual call 

  on their phone



TECHNICAL NOTES:

- For now, use a placeholder/mock function for the actual voice 

  classification (return a random confidence score with mock 

  reasoning) since the real ML model will be integrated later via 

  a backend API

- Structure the code so the mock classifier function can be easily 

  swapped with a real API call to a backend model endpoint later

- Include a settings/API section where a backend endpoint URL can 

  be configured for future integration



Do not include any user authentication for now — keep it simple and 

open access for demo purposes.

```



**Kyun aisa likha:**

- Mock classifier isliye taaki Lovable turant ek working demo bana de — baad mein aap apna real Python ML model backend (Flask/FastAPI) se connect kar sakte ho via API

- History page add kiya hai kyunki college demo/evaluation mein "multiple test cases dikhana" achha impression deta hai

- "How it works" page proposal/report ke liye bhi useful hoga, judges directly wahi dekh ke samajh jaayenge



Jab real model ready ho jaye tab uska Flask/FastAPI backend deploy karke sirf mock function ko real API call se replace karna hoga — Lovable ka frontend as-is reuse ho jayega.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/23f87cea-e1e9-410f-981d-d88b325ed7c1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
