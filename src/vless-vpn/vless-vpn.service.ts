import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import qs from 'qs';
import { ClientDataDto } from './dto/vlessDto';

@Injectable()
export class VlessVpnService {
  constructor(private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    const data = qs.stringify({ username, password });
    try {
      console.log(data, 'data');
      const response = await axios.post(`http://138.124.115.185:12144/R35c0HVMFQSS5g8/login`, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      });
      console.log(response.data);
      const cookies = response.headers['set-cookie'];
      if (!cookies) {
        throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
      }
      const sessionCookie = cookies.find((cookie) => cookie.startsWith('3x-ui='));
      if (!sessionCookie) {
        throw new HttpException('Session cookie not found', HttpStatus.UNAUTHORIZED);
      }

      const sessionId = sessionCookie.split(';')[0].split('=')[1];

      if (!sessionId) {
        throw new HttpException('Invalid session response', HttpStatus.UNAUTHORIZED);
      }

      return sessionId;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw new HttpException(error.response?.data?.message || 'Login failed', HttpStatus.UNAUTHORIZED);
    }
  }

  async addClient(sessionId: string, clientData: any) {
    try {
      const newData = JSON.stringify(clientData);
      const stgData = newData.replace(/"/g, '\\"');
      console.log(stgData);
      const data = {
        id: 2,
        settings: JSON.stringify(clientData),
      };
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://138.124.115.185:12144/R35c0HVMFQSS5g8/panel/api/inbounds/addClient',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Cookie: `3x-ui=${sessionId}`,
          withCredentials: true,
        },
        data: data,
      };


      const response = await axios.request(config);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding client:', error.response?.data || error.message);
      throw new HttpException('Failed to add client', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delClient(sessionId: string) {
    console.log(sessionId, 'айди лоя уаления');
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `http://138.124.115.185:12144/R35c0HVMFQSS5g8/panel/api/inbounds/1/delClient/14`,
      headers: {
        Cookie: `3x-ui=${sessionId}`,
        Accept: 'application/json',
      },
      withCredentials: true,
    };
    axios
      .request(config)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async getStats(sessionId) {
    try {
      const response = await axios.get(
        `http://138.124.115.185:12144/R35c0HVMFQSS5g8/panel/api/inbounds/get/1`,
        {
          headers: {
            Cookie: `3x-ui=${sessionId}`,
            Accept: 'application/json',
          },
          withCredentials: true,
        },
      );
      console.log(response.data);
    } catch (error) {
      console.log(error.message);
    }
  }

  async addInbound(sessionId: string): Promise<any> {
    try {
      const data = {
        enable: true,
        remark: 'New inbound',
        listen: '',
        port: 48965,
        protocol: 'vmess',
        expiryTime: 0,
        settings: JSON.stringify({
          clients: [],
          decryption: 'none',
          fallbacks: [],
        }),
        streamSettings: JSON.stringify({
          network: 'ws',
          security: 'none',
          wsSettings: {
            acceptProxyProtocol: false,
            path: '/',
            headers: {},
          },
        }),
        sniffing: JSON.stringify({
          enabled: true,
          destOverride: ['http', 'tls'],
        }),
      };
      console.log(data);
      const response = await axios.post(
        'http://138.124.115.185:12144/R35c0HVMFQSS5g8/panel/api/inbounds/add',
        data,
        {
          headers: {
            Cookie: `session=${sessionId}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          maxBodyLength: Infinity,
        },
      );


      console.log(response.data);
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Error adding inbound',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
