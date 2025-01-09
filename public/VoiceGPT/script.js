let pc; // Declare the peer connection globally
let dc; // Declare the data channel globally
let isSessionActive = false; // Track the session state
let isAudioEnabled = true; // Initially unmuted
let recognition; // Speech recognition instance
let localStream; // Store the local media stream

async function init() {
  console.log("Initializing WebRTC session...");
  document.getElementById("loading").style.display = "flex"; // Show loader

  // Request the Ephemeral Key
  try {
    const tokenResponse = await fetch("/openai/generate-key");
    if (!tokenResponse.ok) {
      throw new Error("Failed to fetch ephemeral key");
    }
    const data = await tokenResponse.json();
    console.log("Session response data:", data);
    const EPHEMERAL_KEY = data.key;
    console.log("Ephemeral Key received:", EPHEMERAL_KEY);

    // Create WebRTC Peer Connection
    pc = new RTCPeerConnection();
    console.log("WebRTC Peer Connection created.");

    // Handle Audio Streams
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = localStream.getTracks()[0];
    pc.addTrack(audioTrack);
    console.log("User media stream added to Peer Connection.");

    const audioEl = document.getElementById("audioOutput");
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
      console.log("Received remote audio stream.");
    };

    // Set Up Data Channel
    dc = pc.createDataChannel("oai-events");
    dc.addEventListener("message", (e) => {
      const realtimeEvent = JSON.parse(e.data);
      console.log("Received event from server:", realtimeEvent);

      // Handle conversation created event
      if (realtimeEvent.type === 'conversation.created') {
        const conversationId = realtimeEvent.conversation.id;
        const conversationEl = document.createElement('div');
        conversationEl.classList.add('message', 'incoming');
        conversationEl.innerHTML = `<p>Conversation started: ${conversationId}</p>`;
        document.getElementById("transcriptions").appendChild(conversationEl);
        console.log("Displayed conversation created:", conversationId);
      }

      // Handle conversation item created event
      if (realtimeEvent.type === 'conversation.item.created') {
        const item = realtimeEvent.item;
        if (item.content && item.content.length > 0 && item.content[0].transcript) {
          const transcript = item.content[0].transcript;
          const transcriptEl = document.createElement('div');
          transcriptEl.classList.add('message', 'outgoing');
          transcriptEl.innerHTML = `<p>User: ${transcript}</p>`;
          document.getElementById("transcriptions").appendChild(transcriptEl);
          console.log("Displayed user transcription:", transcript);
        }
      }

      // Display the response from the AI
      if (realtimeEvent.type === 'response') {
        const responseText = realtimeEvent.response.text;
        if (typeof responseText === 'string' && responseText.trim()) {
          const responseEl = document.createElement('div');
          responseEl.classList.add('message', 'incoming');
          responseEl.innerHTML = `<p>AI: ${responseText}</p>`;
          document.getElementById("transcriptions").appendChild(responseEl);
          console.log("Displayed AI response:", responseText);
        }
      }

      // Display the AI's audio transcript
      if (realtimeEvent.type === 'response.audio_transcript.done') {
        const transcript = realtimeEvent.transcript;
        if (typeof transcript === 'string' && transcript.trim()) {
          const transcriptEl = document.createElement('div');
          transcriptEl.classList.add('message', 'incoming');
          transcriptEl.innerHTML = `<p>AI: ${transcript}</p>`;
          document.getElementById("transcriptions").appendChild(transcriptEl);
          console.log("Displayed AI audio transcript:", transcript);
        }
      }

      // Display the user's speech-to-text transcription
      if (realtimeEvent.type === 'conversation.item.input_audio_transcription.completed') {
        const transcript = realtimeEvent.transcript;
        if (typeof transcript === 'string' && transcript.trim()) {
          const transcriptEl = document.createElement('div');
          transcriptEl.classList.add('message', 'outgoing');
          transcriptEl.innerHTML = `<p>User: ${transcript}</p>`;
          document.getElementById("transcriptions").appendChild(transcriptEl);
          console.log("Displayed user transcription:", transcript);
        }
      }
    });
    console.log("Data channel created and event listener added.");

    // Start the Session
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("SDP offer created and set as local description.");

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";

    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });
    console.log("SDP offer sent to OpenAI API.");

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
    console.log("SDP answer received and set as remote description.");

    // Wait for the data channel to open before sending the initial event
    dc.addEventListener("open", () => {
      console.log("Data channel opened.");
      document.getElementById("loading").style.display = "none"; // Hide loader
      const responseCreate = {
        type: "response.create",
        response: {
          modalities: ["audio"], // Enable audio chat by default
          instructions: "Talk very shortly,Provide a clear and concise response. Avoid using Spanish, ensure the answer is precise and relevant to the query",
        },
      };
      dc.send(JSON.stringify(responseCreate));
      console.log("Initial event sent to server:", responseCreate);
    });

    // Start speech recognition
    startSpeechRecognition();

    isSessionActive = true;
    updateButtonState();
    document.getElementById("startPrompt").style.display = "none"; // Hide the start prompt

  } catch (error) {
    console.error("Error during WebRTC initialization:", error);
    document.getElementById("loading").style.display = "none"; // Hide loader on error
  }
}

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    console.log('Transcribed speech:', transcript);

    // Display the user's speech as text
    if (transcript) {
      const userSpeechEl = document.createElement('div');
      userSpeechEl.classList.add('message', 'outgoing');
      userSpeechEl.innerHTML = `<p> ${transcript}</p>`;
      document.getElementById("transcriptions").appendChild(userSpeechEl);
      console.log("Displayed user transcription:", transcript);

      // Send the transcribed text to the server
      if (dc && dc.readyState === "open") {
        const textEvent = {
          type: "response.create",
          response: {
            modalities: ["audio"],
            instructions: transcript,
          },
        };
        dc.send(JSON.stringify(textEvent));
        console.log("Sent transcribed text event to server:", textEvent);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };

  recognition.onend = () => {
    if (isSessionActive && isAudioEnabled) {
      recognition.start(); // Restart recognition if the session is still active and audio is enabled
    }
  };

  recognition.start();
}

function stopSession() {
  if (pc) {
    pc.close();
    pc = null;
    console.log("WebRTC session stopped.");
  }
  if (recognition) {
    recognition.stop();
  }
  isSessionActive = false;
  updateButtonState();
}

function updateButtonState() {
  const startButton = document.querySelector(".start-button");
  const stopButton = document.querySelector(".stop-button");

  if (isSessionActive) {
    startButton.style.display = "none";
    stopButton.style.display = "block";
  } else {
    startButton.style.display = "block";
    stopButton.style.display = "none";
  }
}

document.querySelector(".start-button").addEventListener("click", () => {
  init();
});

document.querySelector(".stop-button").addEventListener("click", () => {
  stopSession();
});

document.getElementById("micIcon").addEventListener("click", () => {
  isAudioEnabled = !isAudioEnabled;
  const audioTrack = localStream.getTracks()[0];
  const micIcon = document.getElementById("micIcon");
  const micStatus = document.getElementById("micStatus");
  if (isAudioEnabled) {
    audioTrack.enabled = true;
    recognition.start();
    micIcon.src = "VoiceGPT/icons/microphone.png";
    micStatus.textContent = "Listening";
    console.log("Microphone unmuted.");
  } else {
    audioTrack.enabled = false;
    recognition.stop();
    micIcon.src = "VoiceGPT/icons/mute.png";
    micStatus.textContent = "Muted";
    console.log("Microphone muted.");
  }
});