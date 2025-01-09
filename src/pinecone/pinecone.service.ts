import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PineconeService {
  private readonly apiKey = process.env.PINECONE_API_KEY;
  private readonly environment = process.env.PINECONE_ENV;
  private readonly indexName = process.env.PINECONE_INDEX_NAME;
  private readonly host = process.env.PINECONE_HOST;

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Api-Key': this.apiKey,
    };
  }

  async createIndex() {
    const url = `https://controller.${this.environment}.pinecone.io/databases`;
    const data = {
      name: this.indexName,
      dimension: 1536,
      metric: 'cosine',
    };

    try {
      const response = await axios.post(url, data, { headers: this.headers });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Index already exists
        return { message: 'Index already exists' };
      }
      throw error;
    }
  }

  async upsertVectors(vectors: any[]) {
    const url = `${this.host}/vectors/upsert`;
    const data = {
      vectors,
    };

    try {
      const response = await axios.post(url, data, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async queryVectors(vector: number[]) {
    const url = `${this.host}/query`;
    const data = {
      vector,
      topK: 10,
    };

    try {
      const response = await axios.post(url, data, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
