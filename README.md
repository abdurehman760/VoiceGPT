# Voice GPT Backend

This project is a backend service for a voice-based interaction with OpenAI's GPT model. It uses NestJS for the backend framework and integrates with OpenAI's API for real-time responses and audio transcription.

## Features

- Real-time voice interaction with OpenAI's GPT model.
- Audio transcription using OpenAI's Whisper model.
- WebSocket communication for real-time updates.
- Mute and unmute microphone functionality.
- Loader animation during session initialization.

## Setup

### Prerequisites

- Node.js (>= 14.x)
- npm (>= 6.x)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/voice-gpt-backend.git
   cd voice-gpt-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
   PORT=3000
   ```

### Running the Application

1. Start the NestJS server:

   ```bash
   npm run start
   ```

2. Open your browser and navigate to `http://localhost:3000` to access the frontend.

## Project Structure

- `src/`: Contains the main source code for the backend.
  - `app.module.ts`: Main application module.
  - `main.ts`: Entry point for the application.
  - `openai/`: Contains the OpenAI integration.
    - `openai.module.ts`: OpenAI module.
    - `openai.service.ts`: Service for interacting with OpenAI API.
    - `openai.controller.ts`: Controller for handling API requests.
  - `voice/`: Contains the WebSocket gateway for voice interaction.
    - `voice.module.ts`: Voice module.
    - `voice.gateway.ts`: WebSocket gateway for handling voice interactions.

- `public/`: Contains the frontend files.
  - `index.html`: Main HTML file for the frontend.
  - `styles.css`: CSS file for styling the frontend.
  - `script.js`: JavaScript file for handling frontend logic.

## API Endpoints

- `POST /openai/interact`: Interact with the OpenAI model using text input.
- `POST /openai/generate-key`: Generate an ephemeral key for real-time interaction.
- `GET /openai/generate-key`: Retrieve an ephemeral key for real-time interaction.
- `POST /openai/transcribe`: Transcribe audio using OpenAI's Whisper model.

## WebSocket Events

- `connection`: Triggered when a client connects.
- `disconnect`: Triggered when a client disconnects.
- `message`: Send a message to the client.
- `overrideUserInstructions`: Override the default user instructions.

## Frontend Functionality

- Start and stop session buttons.
- Mute and unmute microphone functionality.
- Loader animation during session initialization.
- Display of transcriptions and AI responses.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [NestJS](https://nestjs.com/)
- [OpenAI](https://openai.com/)
- [Socket.IO](https://socket.io/)
