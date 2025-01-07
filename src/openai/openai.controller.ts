import { Controller, Post, Body, Get, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OpenAIService } from './openai.service';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post('interact')
  async interact(@Body('text') text: string): Promise<any> {
    return this.openAIService.fetchResponse(text);
  }

  @Post('generate-key')
  async generateEphemeralKey(): Promise<any> {
    const key = await this.openAIService.generateEphemeralKey();
    console.log('Generated Ephemeral Key:', key);
    return { key };
  }

  @Get('generate-key')
  async getEphemeralKey(): Promise<any> {
    const key = await this.openAIService.generateEphemeralKey();
    console.log('Generated Ephemeral Key:', key);
    return { key };
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file'))
  async transcribe(@UploadedFile() file: Express.Multer.File): Promise<any> {
    const transcript = await this.openAIService.transcribeAudio(file);
    return { text: transcript };
  }
}
