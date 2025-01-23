import { Injectable } from '@nestjs/common';
import { OutlineVPN } from 'outlinevpn-api';
import { PrismaService } from '../prisma/prisma.service';
import * as process from 'node:process';
import { createKeyDto, removeKeyDto } from './dto/outline.dto';

@Injectable()
export class OutlineVpnService {
  constructor(private readonly prisma: PrismaService) {}

  private async createOutlineClient(regionId: number) {
    const region = await this.prisma.region.findUnique({
      where: {
        id: regionId,
      },
    });
    return new OutlineVPN({
      apiUrl: region.apiUrl,
      fingerprint: region.fingerprint,
    });
  }

  private gbToBites(gb: number) {
    return gb * 1024 * 1024 * 1024;
  }

  async createKey(dto: createKeyDto) {
    console.log(dto);
    const region = await this.prisma.region.findUnique({
      where: {
        id: dto.regionId,
      },
    });
    try {
      const outlineClient = await this.createOutlineClient(dto.regionId);

      let newKey;
      try {
        newKey = await outlineClient.createAccessKey({
          name: String(dto.userId),
        });
      } catch (error) {
        console.error(`Failed to create access key in Outline: ${error.message}`);
        throw new Error('Failed to create access key on the Outline server.');
      }
      console.log(newKey, 'NEW KEY');
      try {
        newKey.accessUrl = newKey.accessUrl.replace('?outline=1', `#SLIVKI_VPN_${region.region_name_eng}`);
        await this.prisma.vpn_keys.create({
          data: {
            user_id: dto.userId,
            key: newKey.accessUrl,
            key_id: Number(newKey.id),
            region_id: dto.regionId,
            is_active: true,
            protocol_id: Number(process.env.OUTLINE_PROTOCOL_ID),
          },
        });
      } catch (error) {
        console.error(`Failed to save VPN key to database: ${error.message}`);
        throw new Error('Failed to save VPN key to the database.');
      }
    } catch (error) {
      console.error(`Error in createKey: ${error.message}`);
      throw new Error('Failed to create VPN key. Please try again.');
    }
  }

  async createSetKeys(userId: number) {
    const regions = await this.prisma.region.findMany();
    try {
      for (const region of regions) {
        await this.createKey({
          regionId: region.id,
          userId: userId,
        });
      }
    } catch (error) {
      console.error(`Error in createKeys: ${error.message}`);
      throw new Error('Failed to create VPN keys. Please try again.');
    }
  }

  async removeKey(dto: removeKeyDto) {
    try {
      const outlineClient = await this.createOutlineClient(dto.regionId);

      try {
        await outlineClient.deleteAccessKey(String(dto.keyId));
      } catch (error) {
        console.error(`Failed to delete access key in Outline: ${error.message}`);
        throw new Error('Failed to delete access key on the Outline server.');
      }

      try {
        await this.prisma.vpn_keys.delete({
          where: {
            id: dto.keyId,
          },
        });
      } catch (error) {
        console.error(`Failed to delete VPN key from database: ${error.message}`);
        throw new Error('Failed to delete VPN key from the database.');
      }
    } catch (error) {
      console.error(`Error in removeKey: ${error.message}`);
      throw new Error('Failed to remove VPN key. Please try again.');
    }
  }

  async removeAllKeysUser(userId: number) {
    const keys = await this.prisma.vpn_keys.findMany({
      where: {
        user_id: userId,
      },
    });
    if (!keys) {
      return 'User does not have keys';
    }
    try {
      for (const key of keys) {
        await this.removeKey({ keyId: key.id, regionId: key.region_id });
      }
    } catch (error) {
      console.error(`Error in removeKey: ${error.message}`);
      throw new Error('Failed to remove VPN key. Please try again.');
    }
  }

  async getAllKeys() {
    try {
      return this.prisma.vpn_keys.findMany();
    } catch (error) {
      console.error(`Error in getAllKeys: ${error.message}`);
      throw new Error('Failed to get All Keys.');
    }
  }

  async delKey(keyId: number) {
    if (!(await this.prisma.vpn_keys.findUnique({ where: { id: keyId } }))) {
      return new Error('this key not found');
    }
    try {
      return this.prisma.vpn_keys.delete({ where: { id: keyId } });
    } catch (error) {
      console.error(`Error deleting key: ${error.message}`);
      throw new Error('Failed deleting VPN key. Please try again.');
    }
  }

  async getMetrics(regionId: number) {
    try {
      const outlineClient = await this.createOutlineClient(regionId);
      const usage = await outlineClient.getDataUsage();
      const status = await outlineClient.getShareMetrics();
      await outlineClient.setShareMetrics(false);

      return { metrics: usage, status: status };
    } catch (error) {
      console.error(`Error in getMetrics: ${error.message}`);
      throw new Error('Failed to get metrics. Please try again.');
    }
  }
}
