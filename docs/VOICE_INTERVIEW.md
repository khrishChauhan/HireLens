# HireLens — Live Voice Interview Experience (Browser Web Speech + Groq Adaptive Engine)

## 1. Overview & Architecture

HireLens features a ChatGPT-style **Live Voice Mode** for technical interviews that runs entirely on our existing **Groq API key** (`GROQ_API_KEY`). It requires **zero third-party paid voice APIs**, **zero OpenAI API keys**, and **no external speech infrastructure**.

### Architecture Clarification: Browser Speech + Groq Intelligence
> [!NOTE]
> **Important Distinction**: Groq text-completion APIs do not themselves provide the browser's audio input or output streams. This implementation combines browser-native speech features (`SpeechRecognition` and `SpeechSynthesis`) with Groq's low-latency `llama-3.3-70b-versatile` text completion and RAG evaluation. It is **not** native real-time speech-to-speech, nor does it claim ChatGPT Realtime WebRTC sub-100ms latency. Instead, it provides a natural, hands-free, continuous conversational loop with silence-based turn-taking and visual audio reactivity.

```
                      ┌────────────────────────────────────────────────────────┐
                      │              Candidate Browser Interface               │
                      │           (Next.js 16 / React 19 / Web Audio API)      │
                      │                                                        │
                      │    ┌──────────────────────────────────────────────┐    │
                      │    │       Centered Audio-Reactive Orb (Canvas)   │    │
                      │    │     - Reacts to Candidate Mic & AI Speech    │    │
                      │    │     - Fluid gradient core & resonant rings   │    │
                      │    └──────────────────────────────────────────────┘    │
                      │    ┌──────────────────────────────────────────────┐    │
                      │    │     Controls: Mute | Pause | Repeat | Text   │    │
                      │    │     Drawer: Transcripts & Live 4-Criteria    │    │
                      │    └──────────────────────────────────────────────┘    │
                      └───────▲──────────────────────────────────────┬─────────┘
                              │                                      │
              Spoken Question │ SpeechSynthesis      SpeechRecognition│ Spoken Answer
                              │ (window.speechSynth) (webkitSpeechRec)│
                              │                                      │
                      ┌───────┴──────────────┐      ┌────────────────▼─────────┐
                      │ Browser TTS Engine   │      │ Browser STT Engine       │
                      │ (Natural Cadence)    │      │ (Continuous & Interim)   │
                      │                      │      │ + 2.5s Silence Detection │
                      └──────────────────────┘      └────────────────┬─────────┘
                                                                     │
                                                   Finalized Candidate Turn
                                                   (Rejected if < 20 chars)
                                                                     │
                                                   ┌─────────────────▼─────────┐
                                                   │ HireLens FastAPI Backend  │
                                                   │ - POST /api/interviews/   │
                                                   │   evaluate-answer         │
                                                   │ - POST /api/interviews/   │
                                                   │   next-question           │
                                                   └─────────────────┬─────────┘
                                                                     │
                                                   ┌─────────────────▼─────────┐
                                                   │ Groq Llama-3.3-70B        │
                                                   │ + FastEmbed RAG Scoring   │
                                                   └─────────────────┬─────────┘
                                                                     │
                                                   ┌─────────────────▼─────────┐
                                                   │ SQLite Session Database   │
                                                   │ (hirelens.db)             │
                                                   └───────────────────────────┘
```

---

## 2. Product Experience & Visual Design

### 2.1 The Centered Audio-Reactive Orb
- Visual centerpiece: A large, glowing Orb centered on a dark canvas (`#09080D` to `#110E1B`) accented with HireLens's signature rose/pink branding (`#F43F5E`, `#DB2777`, `#8B5CF6`).
- **Web Audio API Metering**: Dual `AnalyserNode` frequency extraction measures candidate microphone input in real time, dynamically scaling the Orb ($1.0\times$ to $1.25\times$) with harmonic wave ripples.
- **Visual State Colors**:
  - `idle`: Gentle breathing slate/violet glow.
  - `requesting_permission`: Amber pulse ring (`#F59E0B`).
  - `listening`: Vivid cyan/rose bloom (`#06B6D4` / `#F43F5E`) vibrating to candidate speech energy.
  - `processing_answer`: Shimmering violet/pink rotating swirl (`#8B5CF6` / `#EC4899`).
  - `speaking`: Electric pink/rose harmonic ripple rings (`#F43F5E` / `#D946EF`) pulsating to interviewer voice.
  - `paused`: Soft amber halo indicating microphone is temporarily suspended.
  - `error`: Subtle crimson alert glow (`#EF4444`).
  - `completed`: Emerald completion badge (`#10B981`).

### 2.2 Continuous Conversational Interaction (No Submit Clicks)
- Candidates speak their answers naturally into their microphone.
- As the candidate speaks, finalized speech segments accumulate in the transcript buffer.
- **Dynamic Turn-Taking Silence Detection**:
  - If candidate ends their answer with terminal sentence punctuation (`.`, `?`, `!`) and has spoken $\ge 35$ characters, a responsive **2.0-second silence detector** triggers auto-submission.
  - If candidate pauses mid-sentence without terminal punctuation (thoughtful pause), a generous **2.8-second pause window** gives them breathing room to think without being cut off.
  - **Active Interim Speech Protection**: Whenever candidate is uttering syllables (`interim.length > 0`), the silence timer is immediately cleared so candidate is **never interrupted while speaking**.
  - **Minimum Threshold**: Incomplete or empty utterances ($< 20$ characters) do not trigger auto-submission.
- **Manual "Done Speaking"**: An instant submission button merges any trailing interim syllables with the finalized transcript, normalizes technical terms, and submits immediately ($\ge 10$ characters).

### 2.3 Audio Interlocking & Acoustic Settling
To guarantee the interviewer does not capture its own synthesized voice:
1. **Strictly Suspended Recognition**: `recognition.stop()` is executed **before** `speechSynthesis.speak()` begins.
2. **Acoustic Settling Delay (200ms)**: After speech synthesis `onend` or `onerror` fires, a 200ms acoustic delay elapses before opening microphone recognition, preventing computer speaker room reverberation from triggering the mic.
3. **Redundant Acknowledgement Prefix Stripping**: Redundant prefixes (e.g. "Got it. Got it. How did you...") are stripped so spoken TTS is crisp and non-repetitive.
4. **Tab Visibility Protection**: When browser tab switches to background (`visibilityState === 'hidden'`), assistant speech halts immediately, listening stops, silence timers are cleared, and candidate answer drafts are securely preserved in memory.

---

## 3. The 8-State Conversation State Machine

Implemented cleanly in [`useLiveVoiceInterview.ts`](file:///k:/code/HireLens/frontend/src/lib/speech/useLiveVoiceInterview.ts):

| State | Description | Mic Active? | Audio Output? | Transition Trigger |
| :--- | :--- | :---: | :---: | :--- |
| `idle` | Initial session state prior to vocalization | No | No | Auto-initiates on mount |
| `requesting_permission` | Checking microphone access via Web Speech API | Pending | No | Prompt granted by candidate |
| `listening` | Mic listening; candidate answers; Orb reacts to mic volume | **Yes** | No | 2.0s / 2.8s dynamic silence on $\ge 20$ chars |
| `processing_answer` | Evaluating answer via Groq & retrieving next question | No | No | Groq evaluation & question generation complete |
| `speaking` | Assistant vocalizes acknowledgement & next question | No | **Yes** | Speech synthesis `onend` fires + 200ms settling delay |
| `paused` | Candidate clicked Pause or switched browser tab | No | No | Candidate clicks "Resume" |
| `error` | Mic denied, unsupported browser, or network failure | No | No | Candidate retry or switch to Text Mode |
| `completed` | Max question budget met; wrap-up message spoken | No | No | Final report stage |

---

## 4. Preservation of HireLens Adaptive Interview Engine

1. **Progressive Conversational Arc & Natural Memory**:
   - **Full Transcript Context**: Groq receives complete multi-turn history including all previously asked questions, candidate answers, and technologies mentioned (FastAPI, SQLite, Redis, RAG, etc.).
   - **Stage A — Warm-Up**: Comfortable opening, verifying candidate trajectory.
   - **Stage B — Project Overview**: Candidate describes their primary project in their own words.
   - **Stage C — Project Deep Dive**: Follows candidate's specific architectural choices and technologies directly from their answers.
   - **Stage D — Topic Transition**: Natural transition into unaddressed job description requirements.
   - **Stage E — Technical Depth**: Calibrated technical depth (clarification if score $< 3.0$, advanced trade-offs if score $\ge 3.8$).
   - **Stage F — Wrap-Up**: Concludes naturally without asking new technical questions when budget is met.
2. **Conversational Acknowledgement Sanitization**:
   - Eliminates sycophantic praise ("Awesome!", "Incredible!", "Brilliant!").
   - Enforces concise 1–4 word acknowledgements ("Got it.", "Makes sense.", "Interesting.", "Understood.").
   - Friendly acknowledgements are strictly decoupled from scoring and never reveal expected answers.
3. **Deterministic Evaluation Rubric**:
   - Scores responses across 4 criteria (`technical_correctness`, `problem_solving`, `relevance`, `communication`) on a 1.0–5.0 scale.
   - Calculates deterministic arithmetic percentage in Python.
   - Verifies evidence quotes against original resume chunks via RAG.
4. **SQLite Persistence (`hirelens.db`)**:
   - Confirmed candidate turns and evaluations are saved in SQLite via `saveSessionAnswer`.
   - Browser refresh preserves completed turns and resume state.

---

## 5. Security & Privacy

- **Server-Side Groq Key Only**: `GROQ_API_KEY` is loaded strictly on the backend (`backend/.env`). No secrets exist on the client.
- **Zero Raw Audio Storage**: Raw audio is never transmitted or stored on any server. Only finalized text transcripts are sent to the evaluation API.
- **Untrusted Input Protection**: Candidate transcripts are sanitized and protected against prompt injection.
- **Duplicate Submission Guards**: Concurrent turn submissions are strictly prevented while evaluation is in-flight.

---

## 6. Browser Compatibility Matrix

| Browser | Speech Recognition (STT / Mic) | Speech Synthesis (TTS / Audio) | Notes / Behavior |
| :--- | :--- | :--- | :--- |
| **Google Chrome (v33+)** | Native (`webkitSpeechRecognition`) | Native (`speechSynthesis`) | Full immersive continuous voice interview |
| **Microsoft Edge (Chromium)**| Native (`webkitSpeechRecognition`) | Native (`speechSynthesis`) | Full immersive continuous voice interview |
| **Brave / Opera / Vivaldi** | Native (Chromium engine) | Native (`speechSynthesis`) | Full immersive continuous voice interview |
| **Apple Safari (macOS/iOS)**| Native (`webkitSpeechRecognition`)* | Native (`speechSynthesis`) | Audio works; mic requires user interaction |
| **Mozilla Firefox** | Flag required (`media.webspeech.recognition`)| Native (`speechSynthesis`) | Clear warning shown with 1-click fallback to Text Mode |
| **Headless / Automated CI** | Unsupported | Unsupported | Gracefully defaults to Text Mode |

*\* Note: Safari requires explicit user interaction before audio synthesis can play.*

---

## 7. Automated Tests vs. Live Browser Verification

### 7.1 Automated Test Suite
Ran 79 automated frontend tests across 28 suites:

```bash
# Run all frontend unit and integration tests
cd frontend && npm test
```
```
# tests 79
# suites 28
# pass 79
# fail 0
```

Verified scenarios:
- `isSpeechRecognitionSupported()` and `isSpeechSynthesisSupported()` feature detection.
- Complete 8-state machine transitions (`idle` $\rightarrow$ `requesting_permission` $\rightarrow$ `listening` $\rightarrow$ `processing_answer` $\rightarrow$ `speaking` $\rightarrow$ `paused` $\rightarrow$ `error` $\rightarrow$ `completed`).
- Dynamic silence thresholding (2.0s for terminal punctuation vs 2.8s for mid-sentence pauses).
- Active interim speech protection (clearing timer to prevent interruptions).
- Manual "Done Speaking" merging trailing interim syllables with technical normalization.
- Tab visibility change handler halting speech & listening while preserving draft answers.
- Acoustic settling delay (200ms) before microphone reactivation.
- Technical terminology normalization layer and audit trail (raw vs. corrected).
- Audio interlocking: strictly stopping recognition before TTS playback.
- Prevention of duplicate turn submissions while evaluation is processing.
- Permission denial (`not-allowed`) and network error translation.
- Two-way switching between Voice Mode and Text Mode with draft preservation.

### 7.2 Backend Pytest Suite
Ran all 63 backend tests verifying adaptive interview routing, conversational transcript history, acknowledgement sanitization, quote verification, and session persistence:
```bash
.\backend\.venv\Scripts\python.exe -m pytest backend/tests
```
```
======================== 63 passed, 1 warning in 3.35s ========================
```

---

## 8. Manual Testing Steps in a Real Browser

1. **Start the Backend**:
   ```bash
   python -m uvicorn main:app --app-dir backend --reload
   ```
2. **Start the Frontend**:
   ```bash
   cd frontend && npm run dev
   ```
3. **Launch Live Voice Interview**:
   - Open `http://localhost:3000` in Google Chrome or Microsoft Edge.
   - Upload a sample PDF resume or resume text and advance to **Stage 3: Adaptive Technical Interview**.
   - Click **"Launch Live Voice Mode"** or toggle **"Voice"** in the top bar.
4. **Observe Initial Spoken Question**:
   - The screen transforms into the ChatGPT-style dark canvas with the centered glowing Orb.
   - The interviewer reads the warm-up question aloud in natural spoken cadence.
   - The Orb ripples with pink/violet waves during speech.
5. **Speak Your Response Naturally**:
   - When the assistant finishes, the state automatically transitions to **Listening** (cyan/rose glow).
   - Speak your engineering response (e.g., *"In my project HireLens, I designed the asynchronous FastAPI backend with SQLite persistence..."*).
   - Watch the live subtitle preview update as you speak.
6. **Continuous Turn-Taking**:
   - Stop speaking and pause for ~2.5 seconds.
   - The Orb switches to **Groq RAG** processing swirl (`processing_answer`).
   - Groq scores your answer, verifies evidence quotes, and generates the next relevant follow-up question.
   - The interviewer vocalizes a natural acknowledgement (*"Got it. That makes sense."*) followed by the next technical question.
   - Listening resumes automatically!
7. **Test Controls & Drawer**:
   - Click **Pause** / **Resume** to pause microphone listening.
   - Click **Repeat** to hear the question re-spoken.
   - Click **Transcript** in the top-right to view the slide-out history drawer and live 4-criteria scores.
   - Click **Text Mode** to return to the text interview without losing your current progress.
