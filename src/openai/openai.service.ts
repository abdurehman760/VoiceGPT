import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import * as FormData from 'form-data';

dotenv.config();

interface TranscriptionResponse {
  text: string;
}

@Injectable()
export class OpenAIService {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = process.env.REALTIME_MODEL;

  async fetchResponse(input: string): Promise<any> {
    const url = `https://api.openai.com/v1/realtime`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(
        url,
        { input, model: this.model },
        { headers },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error communicating with OpenAI API',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async connectToRealtimeAPI(): Promise<WebSocket> {
    const url = `wss://api.openai.com/v1/realtime?model=${this.model}`;
    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    return new Promise((resolve, reject) => {
      ws.on('open', () => resolve(ws));
      ws.on('error', (err) => reject(err));
    });
  }

  async sendEvent(ws: WebSocket, event: any): Promise<void> {
    ws.send(JSON.stringify(event));
  }

  async receiveEvent(ws: WebSocket): Promise<any> {
    return new Promise((resolve) => {
      ws.on('message', (message) => {
        const serverEvent = JSON.parse(message.toString());
        resolve(serverEvent);
      });
    });
  }

  async generateEphemeralKey(): Promise<string> {
    const url = 'https://api.openai.com/v1/realtime/sessions';
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'verse',
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      const data = await response.json();
      console.log('Ephemeral Key Response:', data); // Log the response
      return data.client_secret.value; // Correctly extract the ephemeral key
    } catch (error) {
      console.error('Error generating ephemeral key:', error);
      throw new Error('Failed to generate ephemeral key');
    }
  }

  async generateResponse(prompt: string): Promise<any> {
    const ephemeralKey = await this.generateEphemeralKey();
    const url = 'https://api.openai.com/v1/realtime';
    const headers = {
      Authorization: `Bearer ${ephemeralKey}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(
        url,
        {
          model: 'gpt-4o-realtime-preview-2024-12-17',
          prompt: prompt,
        },
        { headers }
      );
      return response.data; // Handle the response data (text and audio)
    } catch (error) {
      console.error('Error interacting with OpenAI API:', error);
      throw new Error('Failed to communicate with OpenAI API');
    }
  }

  async transcribeAudio(file: Express.Multer.File): Promise<string> {
    console.log('Received audio file for transcription:', file.originalname); // Log received audio file
    const url = 'https://api.openai.com/v1/audio/transcriptions';
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    formData.append('model', 'whisper-1');

    try {
      const response = await axios.post<TranscriptionResponse>(url, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      console.log('Transcription result:', response.data.text); // Log transcription result
      return response.data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}
