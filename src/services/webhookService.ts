import { DiscordWebhookContent } from '../types';

/**
 * Service for handling webhook notifications
 */
export class WebhookService {
  private static WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  private static TIMEOUT_MS = 10000; // 10-second timeout

  /**
   * Sends a notification to Discord webhook
   * @param content The webhook content to send
   * @returns A promise that resolves when the webhook is sent
   */
  public static async sendDiscordNotification(content: DiscordWebhookContent): Promise<boolean> {
    try {
      // Validate webhook URL
      if (!this.WEBHOOK_URL) {
        console.error('Discord webhook URL is not configured. Skipping Discord notification.');
        return false;
      }

      // Set up request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      try {
        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(content),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Discord webhook error:', errorText);
          throw new Error(`Failed to send Discord notification: ${response.status} ${response.statusText}`);
        }
        
        console.log('Discord webhook sent successfully');
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('Discord webhook request timed out');
        } else {
          console.error('Error sending Discord notification:', error);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in sendDiscordNotification:', error);
      return false;
    }
  }

  /**
   * Creates a Discord webhook content for an order
   * @param orderData The order data
   * @param paymentProofUrl The URL to the payment proof image
   * @returns The formatted Discord webhook content
   */
  public static createOrderNotification(orderData: any, paymentProofUrl: string): DiscordWebhookContent {
    // Set color based on rank
    const embedColor = 0x00aa00; // Default green
    
    // Format timestamp for better readability
    const formattedDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const webhookContent: DiscordWebhookContent = {
      username: "Champa Store Bot",
      avatar_url: "https://i.imgur.com/R66g1Pe.jpg",
      content: "🎮 **NEW RANK ORDER!** 🎮",
      embeds: [
        {
          title: `New ${orderData.rank} Rank Order`,
          color: embedColor,
          description: `A new order has been received and is awaiting processing.`,
          fields: [
            {
              name: "👤 Customer",
              value: `\`${orderData.username}\``,
              inline: true
            },
            {
              name: "🎮 Platform",
              value: `\`${orderData.platform.toUpperCase()}\``,
              inline: true
            },
            {
              name: "⭐ Rank",
              value: `\`${orderData.rank}\``,
              inline: true
            },
            {
              name: "💰 Price",
              value: `\`$${orderData.price}\``,
              inline: true
            },
            {
              name: "⏰ Time",
              value: `\`${formattedDate}\``,
              inline: true
            }
          ],
          thumbnail: {
            url: "https://i.imgur.com/R66g1Pe.jpg"
          },
          footer: {
            text: "Champa Store Order System",
            icon_url: "https://i.imgur.com/R66g1Pe.jpg"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Add the payment proof image as a separate embed
    if (paymentProofUrl) {
      webhookContent.embeds.push({
        title: "💳 Payment Proof",
        color: embedColor,
        image: {
          url: paymentProofUrl
        }
      });
    }

    return webhookContent;
  }
} 