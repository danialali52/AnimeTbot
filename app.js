// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000; // Use the provided PORT or default to 3000

// Initialize Telegram bot
const botToken = process.env.TELEGRAM_BOT_TOKEN; // Use environment variable for bot token
const bot = new TelegramBot(botToken, { polling: true });

// Load anime data from JSON file
const animeData = JSON.parse(fs.readFileSync('./animeData.json'));

// Configure Express to use JSON body parser
app.use(bodyParser.json());

// Define route for root endpoint
app.get('/', (req, res) => {
  res.send('Telegram bot is running!');
});

// Handle '/start' command from Telegram
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🌟✨ Welcome to Silymoona Anime Search Bot! ✨🌟

Feel the magic 🧙‍♂️✨ by sending me the name of an anime 🎌📺 to get all the juicy details about it 🤩✨. Or simply use /list to explore our vast library of available anime titles 📚🌟.

Let's embark on an anime adventure together! 🚀🌈`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle incoming messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const animeName = msg.text;

  // Replace 'YOUR_CHANNEL_ID_OR_USERNAME' with your actual channel ID or username
  const channelId = process.env.CHANNEL_ID || 'YOUR_CHANNEL_ID_OR_USERNAME';

  // Check if the user has joined the channel
  bot.getChatMember(channelId, msg.from.id)
    .then(member => {
      if (member && (member.status === 'member' || member.status === 'administrator')) {
        // User is a member of the channel, proceed with the message handling
        handleAnimeRequest(chatId, animeName);
      } else {
        // User is not a member of the channel, prompt them to join
        bot.sendMessage(chatId, 'Please join our channel https://t.me/+Rj421cRLWeIyZjlk to use the bot: ' + channelId);
      }
    })
    .catch(error => {
      console.error('Error checking channel membership:', error);
    });
});

// Function to handle anime search requests
function handleAnimeRequest(chatId, animeName) {
  if (!isNaN(animeName)) {
    const index = parseInt(animeName) - 1;

    if (index >= 0 && index < animeData.length) {
      const anime = animeData[index];
      sendAnimeDetails(chatId, anime);
    } else {
      bot.sendMessage(chatId, 'Invalid anime selection. Please select a valid number from the list.', { parse_mode: 'Markdown' });
    }
  } else {
    const filteredAnime = animeData.filter(anime => anime.title.toLowerCase().includes(animeName.toLowerCase()));

    if (filteredAnime.length > 0) {
      const anime = filteredAnime[0];
      sendAnimeDetails(chatId, anime);
    } else {
      bot.sendMessage(chatId, 'Anime not found. Please try again with a different name or use /list to see available anime.', { parse_mode: 'Markdown' });
    }
  }
}

// Function to send anime details to the user
function sendAnimeDetails(chatId, anime) {
  const { title, image, synopsis, language, episodes, sub, dub, download, website } = anime;

  const message = `
✨ *Title:* ${title}
📖 *Synopsis:* ${synopsis}
🌐 *Language:* ${language}
📺 *Episodes:* ${episodes}

🌟 *Streaming Options:*
- [Sub](${sub}) [Watch Now] 📼
- [Dub](${dub}) [Watch Now] 📼

💾 *Download Link:*
- [Download Now](${download}) 💾

🔗 *Website:* [Visit Website](${website})`;

  bot.sendPhoto(chatId, image, { caption: message, parse_mode: 'Markdown' });
}

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Telegram bot server running on port ${port}`);
});
