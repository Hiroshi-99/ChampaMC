import { DiscordWebhookContent, Order } from '../types';

/**
 * Service for handling webhook notifications with security and performance optimizations
 */
export class WebhookService {
  // Use private static variables for configuration
  private static WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  private static TIMEOUT_MS = 8000; // 8-second timeout for faster response
  private static MAX_RETRIES = 2; // Maximum number of retries for webhook sending
  private static RETRY_DELAY_MS = 1000; // 1 second delay between retries

  /**
   * Sends a notification to Discord webhook with retry logic and security measures
   * @param content The webhook content to send
   * @returns A promise that resolves to true if successful, false otherwise
   */
  public static async sendDiscordNotification(content: DiscordWebhookContent): Promise<boolean> {
    // Validate webhook URL format for security
    if (!this.isValidWebhookUrl(this.WEBHOOK_URL)) {
      console.error('Invalid Discord webhook URL format. Skipping Discord notification.');
      return false;
    }

    // Sanitize content for security
    const sanitizedContent = this.sanitizeWebhookContent(content);
    
    // Try sending with retries
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Set up request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
        
        try {
          const response = await fetch(this.WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sanitizedContent),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Discord webhook error (Attempt ${attempt + 1}/${this.MAX_RETRIES + 1}):`, errorText);
            
            // If this is the last retry, fail
            if (attempt === this.MAX_RETRIES) {
              return false;
            }
            
            // Wait before retrying
            await this.delay(this.RETRY_DELAY_MS);
            continue;
          }
          
          return true;
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.error(`Discord webhook request timed out (Attempt ${attempt + 1}/${this.MAX_RETRIES + 1})`);
          } else {
            console.error(`Error sending Discord notification (Attempt ${attempt + 1}/${this.MAX_RETRIES + 1}):`, error);
          }
          
          // If this is the last retry, fail
          if (attempt === this.MAX_RETRIES) {
            return false;
          }
          
          // Wait before retrying
          await this.delay(this.RETRY_DELAY_MS);
        }
      } catch (error) {
        console.error(`Unexpected error in webhook handling (Attempt ${attempt + 1}/${this.MAX_RETRIES + 1}):`, error);
        
        // If this is the last retry, fail
        if (attempt === this.MAX_RETRIES) {
          return false;
        }
        
        // Wait before retrying
        await this.delay(this.RETRY_DELAY_MS);
      }
    }
    
    return false;
  }

  /**
   * Creates a Discord webhook content for an order with proper formatting
   * @param orderData The order data
   * @param paymentProofUrl The URL to the payment proof image
   * @returns The formatted Discord webhook content
   */
  public static createOrderNotification(orderData: Order, paymentProofUrl: string): DiscordWebhookContent {
    // Set color based on rank
    const embedColor = 0x00aa00; // Default green color for embeds
    
    // Format timestamp for better readability
    const formattedDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create webhook content with proper structure
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
              value: `\`${this.sanitizeString(orderData.username)}\``,
              inline: true
            },
            {
              name: "🎮 Platform",
              value: `\`${this.sanitizeString(orderData.platform.toUpperCase())}\``,
              inline: true
            },
            {
              name: "⭐ Rank",
              value: `\`${this.sanitizeString(orderData.rank)}\``,
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

    // Add the payment proof image as a separate embed if URL is valid
    if (paymentProofUrl && this.isValidUrl(paymentProofUrl)) {
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
  
  /**
   * Helper method to validate webhook URL format
   * @param url The webhook URL to validate
   * @returns True if the URL is valid, false otherwise
   */
  private static isValidWebhookUrl(url: string | undefined): boolean {
    if (!url) return false;
    
    try {
      // Check if it's a valid URL first
      new URL(url);
      
      // Check if it's a Discord webhook URL
      return url.includes('discord.com/api/webhooks/');
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Helper method to validate a general URL
   * @param url The URL to validate
   * @returns True if the URL is valid, false otherwise
   */
  private static isValidUrl(url: string | undefined): boolean {
    if (!url) return false;
    
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Helper method to delay execution
   * @param ms Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Sanitizes webhook content to prevent injection attacks
   * @param content The webhook content to sanitize
   * @returns Sanitized webhook content
   */
  private static sanitizeWebhookContent(content: DiscordWebhookContent): DiscordWebhookContent {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(content)) as DiscordWebhookContent;
    
    // Sanitize text fields
    if (sanitized.content) {
      sanitized.content = this.sanitizeString(sanitized.content);
    }
    
    // Sanitize embeds
    if (sanitized.embeds) {
      sanitized.embeds = sanitized.embeds.map(embed => {
        if (embed.title) {
          embed.title = this.sanitizeString(embed.title);
        }
        
        if (embed.description) {
          embed.description = this.sanitizeString(embed.description);
        }
        
        // Sanitize fields
        if (embed.fields) {
          embed.fields = embed.fields.map(field => ({
            name: this.sanitizeString(field.name),
            value: this.sanitizeString(field.value),
            inline: field.inline
          }));
        }
        
        // Sanitize footer
        if (embed.footer && embed.footer.text) {
          embed.footer.text = this.sanitizeString(embed.footer.text);
        }
        
        return embed;
      });
    }
    
    return sanitized;
  }
  
  /**
   * Sanitizes a string to prevent injection attacks
   * @param str The string to sanitize
   * @returns Sanitized string
   */
  private static sanitizeString(str: string): string {
    if (!str) return '';
    
    // Basic sanitization to prevent injection
    return str
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/@everyone/g, '@\u200Beveryone') // Prevent @everyone pings
      .replace(/@here/g, '@\u200Bhere') // Prevent @here pings
      .slice(0, 1500); // Limit length
  }
} 