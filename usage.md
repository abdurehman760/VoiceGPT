# Usage Instructions

## How to Use the App

1. **Start the Backend Server:**
   - Ensure you have all the necessary dependencies installed.
   - Run the backend server using the following command:
     ```bash
     npm run start
     ```

2. **Access the Frontend:**
   - Open your web browser and navigate to `http://localhost:3000`.

3. **Request an Ephemeral API Key:**
   - The frontend will automatically request an ephemeral API key from the backend to authenticate WebRTC connections.

4. **Establish WebRTC Connection:**
   - The frontend will establish a WebRTC peer connection using the ephemeral key and set up the audio stream.

5. **Start Talking:**
   - Click the "Start Talking" button to begin capturing audio input from your microphone.
   - Speak into your microphone to interact with the AI.

6. **View Responses:**
   - The AI's responses will be displayed in the chat interface.
   - Audio responses from the AI will be played back through the audio element.

7. **Stop Talking:**
   - Click the "Stop Talking" button to stop capturing audio input.

## Features

- **Real-Time WebSocket Communication:**
  - Supports real-time WebSocket connections with the frontend to facilitate bidirectional communication.

- **OpenAI Integration:**
  - Interacts with OpenAI's Realtime API to process text and audio inputs and receive responses.

- **Ephemeral API Key Generation:**
  - Generates ephemeral API keys for secure, temporary client-side authentication with OpenAI's Realtime API.

- **Audio Handling:**
  - Handles audio streams, converting audio to text, sending it to OpenAI, and responding with both text and audio.

- **Text and Audio Event Handling:**
  - Manages different event types (text, audio) and sends responses back to the frontend via WebSocket.

## User Interaction

- **Start a Conversation:**
  - Click the "Start Talking" button to begin a conversation with the AI.

- **Ask Questions:**
  - Speak into your microphone to ask questions and interact with the AI.

- **View Conversation History:**
  - The chat interface displays the user's speech as text and the AI's responses.

- **Control the Conversation:**
  - Use the "Start Talking" and "Stop Talking" buttons to control the conversation.

Enjoy interacting with the AI in real-time!
