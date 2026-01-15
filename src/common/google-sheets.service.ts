import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: any;
  private spreadsheetId: string | undefined;

  constructor(private configService: ConfigService) {
    this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEET_ID');
    const clientEmail = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (this.spreadsheetId && clientEmail && privateKey) {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      this.sheets = google.sheets({ version: 'v4', auth });
      this.logger.log('Google Sheets service initialized');
    } else {
      this.logger.warn('Google Sheets configuration missing. Service will not sync data.');
    }
  }

  async syncOrder(order: Order, user?: User) {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      const headers = [
        'Order ID',
        'User ID',
        'Username',
        'Full Name',
        'Total Amount',
        'Status',
        'Items',
        'Shipping Address',
        'Transaction Hash',
        'Created At',
        'Updated At',
      ];

      // Check if order exists in sheet to update or append
      let response;
      try {
        response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'Orders!A:A',
        });
      } catch (error) {
        // If sheet doesn't exist, create it
        if (error.message.includes('range')) {
          this.logger.log('Orders sheet not found, creating it...');
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
              requests: [{
                addSheet: {
                  properties: {
                    title: 'Orders',
                  },
                },
              }],
            },
          });
        } else {
          throw error;
        }
      }

      const rows = response?.data?.values;
      
      // If sheet is empty or headers are missing, add headers
      if (!rows || rows.length === 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'Orders!A1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });
        this.logger.log('Headers added to Google Sheets');
      }

      // Prepare data row
      const itemsString = order.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
      const row = [
        order.id,
        order.userId,
        user?.username || '',
        user?.fullName || '',
        order.totalAmount.toString(),
        order.status,
        itemsString,
        order.shippingAddress || '',
        order.transactionHash || '',
        order.createdAt?.toISOString() || new Date().toISOString(),
        new Date().toISOString(),
      ];

      let rowIndex = -1;
      if (rows) {
        rowIndex = rows.findIndex(r => r[0] === order.id);
      }

      if (rowIndex !== -1) {
        // Update existing row (index is 0-based, but sheet is 1-based)
        const updateRange = `Orders!A${rowIndex + 1}:K${rowIndex + 1}`;
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: updateRange,
          valueInputOption: 'RAW',
          requestBody: {
            values: [row],
          },
        });
        this.logger.log(`Order ${order.id} updated in Google Sheets`);
      } else {
        // Append new row
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'Orders!A:K',
          valueInputOption: 'RAW',
          requestBody: {
            values: [row],
          },
        });
        this.logger.log(`Order ${order.id} appended to Google Sheets`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync order ${order.id} to Google Sheets: ${error.message}`);
    }
  }
}
