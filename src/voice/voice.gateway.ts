import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';
import { OpenAIService } from '../openai/openai.service';
import { Inject } from '@nestjs/common';

@WebSocketGateway()
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(OpenAIService) private readonly openAIService: OpenAIService,
  ) {}

  @WebSocketServer()
  server: Server;

  private userInstructions: string = 'Talk precisely.';

  setUserInstructions(instructions: string) {
    this.userInstructions = instructions;
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectToWebSocket(client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  sendMessage(client: Socket, message: string) {
    client.emit('message', message);
  }

  overrideUserInstructions(client: Socket, instructions: string) {
    this.setUserInstructions(instructions);
    this.sendEvent(client, instructions);
  }

  private connectToWebSocket(client: Socket) {
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
    const ws = new WebSocket(url, {
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    ws.on('open', function open() {
      console.log('Connected to server.');
    });

    ws.on('message', async (message) => {
      const serverEvent = JSON.parse(message.toString());
      console.log(serverEvent);

      switch (serverEvent.type) {
        case 'text':
          const textResponse = await this.openAIService.generateResponse(serverEvent.text);
          this.sendMessage(client, textResponse);
          break;
        case 'audio':
          // Handle audio event
          // Convert audio to text, send to OpenAI, and handle response
          break;
        case 'function_call':
          // Handle function call event
          // Execute specific actions or queries
          break;
        default:
          console.log('Unknown event type:', serverEvent.type);
      }
    });

    this.sendEvent(ws, this.userInstructions);
  }

  private sendEvent(ws: WebSocket, instructions: string) {
    const event = {
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        instructions: instructions || 'Respond mostly in English. Never speak French or Spanish.',
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 10, // Adjust this to detect louder voices
        prefix_padding_ms: 300, // Buffer before the detected speech
        silence_duration_ms: 500, // Silence duration to consider the turn ended
        create_response: true,
      },
    };
    ws.send(JSON.stringify(event));
  }
}
