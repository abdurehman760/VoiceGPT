# Usage Instructions

## Checking the Uploading and Embedding Process

### Step 1: Start the Backend Server
Ensure that your backend server is running. You can start the server using the following command:
```bash
npm run start
```

### Step 2: Access the Dashboard Page
Open your web browser and navigate to the Dashboard Page:
```
http://localhost:3000/dashboard/dashboard.html
```

### Step 3: Upload a Document
1. On the Dashboard Page, click the "Choose File" button and select a PDF or DOCX document to upload.
2. Click the "Upload" button to start the uploading process.

### Step 4: Monitor the Status
- The status message will update to "Uploading..." while the file is being uploaded.
- Once the upload is complete, the status will change to "Processing...".
- After processing, the status will update to "Embedding Created Successfully!" if the embedding was created without errors.

### Step 5: Verify Metadata
- The metadata section will display the document title and the embedding creation time.
- Check the console logs in your browser's developer tools for additional details about the upload and embedding process.

#### Example:
```
Embedding Created Successfully!
Document Title: LLM_MapReduce_Answers.docx
Embedding Creation Time: 1/8/2025, 8:34:43 PM
```

### Step 6: Check Pinecone
- Log in to your Pinecone account and navigate to the index you configured.
- Verify that the embeddings have been upserted into the Pinecone index.

### Troubleshooting
- If the status updates to "Error uploading file.", check the console logs for error details.
- Ensure that your Pinecone and OpenAI API keys are correctly set in the `.env` file.
- Verify that the Pinecone index is correctly configured and accessible.

By following these steps, you can confirm that the document uploading and embedding process is working correctly.

## Testing the AI's Knowledge Retrieval and Response

### Step 1: Start the Backend Server
Ensure that your backend server is running. You can start the server using the following command:
```bash
npm run start
```

### Step 2: Access the Voice GPT Frontend
Open your web browser and navigate to the Voice GPT Frontend:
```
http://localhost:3000/VoiceGPT/index.html
```

### Step 3: Start a Session
1. Click the "Start Session" button to initiate a WebRTC session.
2. Allow microphone access when prompted.

### Step 4: Ask a Question
1. Speak into your microphone and ask a question related to the uploaded documents.
2. The AI will transcribe your speech, retrieve relevant context from Pinecone, and generate a response using OpenAI.

### Step 5: Monitor the Response
- The AI's response will be displayed in the chat interface.
- The response will include both text and audio.

### Troubleshooting
- If the AI does not respond, check the console logs for error details.
- Ensure that your Pinecone and OpenAI API keys are correctly set in the `.env` file.
- Verify that the Pinecone index is correctly configured and accessible.

By following these steps, you can confirm that the AI is able to retrieve knowledge from Pinecone and respond to user queries.
