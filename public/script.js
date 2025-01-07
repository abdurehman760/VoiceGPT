let pc; // Declare the peer connection globally
let dc; // Declare the data channel globally
let isSessionActive = false; // Track the session state

async function init() {
  console.log("Initializing WebRTC session...");

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
    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(ms.getTracks()[0]);
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
        if (typeof item.content === 'string' && item.content.trim()) {
          const itemEl = document.createElement('div');
          itemEl.classList.add('message', 'incoming');
          itemEl.innerHTML = `<p>${item.content}</p>`;
          document.getElementById("transcriptions").appendChild(itemEl);
          console.log("Displayed conversation item created:", item);
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
      const responseCreate = {
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          instructions: "Talk very shortly,Provide a clear and concise response. Avoid using Spanish, ensure the answer is precise and relevant to the query",
        },
      };
      dc.send(JSON.stringify(responseCreate));
      console.log("Initial event sent to server:", responseCreate);
    });

    // Handle user speech
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(ms);
    const processor = audioContext.createScriptProcessor(1024, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    let isSpeaking = false;
    let speechTimeout;
    let audioChunks = [];

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      let sum = 0.0;
      for (let i = 0; i < input.length; ++i) {
        sum += input[i] * input[i];
      }
      const rms = Math.sqrt(sum / input.length);
      if (rms > 0.1) { // Adjust threshold as needed
        if (!isSpeaking) {
          console.log('User started speaking');
          isSpeaking = true;
          clearTimeout(speechTimeout);
          audioChunks = [];
        
        }
        audioChunks.push(...input);
      } else {
        if (isSpeaking) {
          clearTimeout(speechTimeout);
          speechTimeout = setTimeout(() => {
            console.log('User stopped speaking');
            isSpeaking = false;
            document.getElementById('userContainer').classList.remove('speaking');
            document.getElementById('circle1').style.display = 'none';
            document.getElementById('circle2').style.display = 'none';
            document.getElementById('circle3').style.display = 'none';
            // Handle voice detection logic here
            processUserSpeech(audioChunks);
          }, 1000); // Wait for 1 second of silence before processing
        }
      }
    };

    isSessionActive = true;
    updateButtonState();

  } catch (error) {
    console.error("Error during WebRTC initialization:", error);
  }
}

async function processUserSpeech(audioChunks) {
  // Implement the logic to process the user's speech after they have stopped speaking
  console.log('Processing user speech...', audioChunks);

  // Convert audioChunks to Blob
  const audioBlob = new Blob([new Float32Array(audioChunks)], { type: 'audio/wav' });

  // Send the audioBlob to the server for transcription using Whisper
  const formData = new FormData();
  formData.append('file', audioBlob, 'input_audio.wav');
  formData.append('model', 'whisper-1');

  try {
    const response = await fetch('/openai/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const data = await response.json();
    const transcript = data.text;

    // Display the user's speech as text
    const userSpeechEl = document.createElement('div');
    userSpeechEl.classList.add('message', 'outgoing');
    userSpeechEl.innerHTML = `<p>User: ${transcript}</p>`;
    document.getElementById("transcriptions").appendChild(userSpeechEl);
    console.log("Displayed user transcription:", transcript);

    // Send the transcribed text to the server
    if (dc && dc.readyState === "open") {
      const textEvent = {
        type: "response.create",
        response: {
          modalities: ["audio", "text"],
          instructions: transcript,
        },
      };
      dc.send(JSON.stringify(textEvent));
      console.log("Sent transcribed text event to server:", textEvent);
    }
  } catch (error) {
    console.error("Error transcribing audio:", error);
  }
}

function stopSession() {
  if (pc) {
    pc.close();
    pc = null;
    console.log("WebRTC session stopped.");
  }
  isSessionActive = false;
  updateButtonState();
}

function updateButtonState() {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");

  if (isSessionActive) {
    startButton.style.display = "none";
    stopButton.style.display = "block";
  } else {
    startButton.style.display = "block";
    stopButton.style.display = "none";
  }
}

document.getElementById("startButton").addEventListener("click", () => {
  init();
});

document.getElementById("stopButton").addEventListener("click", () => {
  stopSession();
});

document.getElementById("sendButton").addEventListener("click", () => {
  const textInput = document.getElementById("textInput").value;
  if (textInput && dc && dc.readyState === "open") {
    const textEvent = {
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions: textInput,
      },
    };
    dc.send(JSON.stringify(textEvent));
    console.log("Sent text event to server:", textEvent);

    // Display the user's text input
    const userTextEl = document.createElement('div');
    userTextEl.classList.add('message', 'outgoing');
    userTextEl.innerHTML = `<p>User: ${textInput}</p>`;
    document.getElementById("transcriptions").appendChild(userTextEl);
    document.getElementById("textInput").value = ""; // Clear the input field
  }
});

updateButtonState(); // Initialize button state on page load