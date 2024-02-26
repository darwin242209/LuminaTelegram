//-------------------------------------------------------------------------------Original Code-------------------------
const keep_alive = require('./keep_alive.js');
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const { getImage, getChat } = require("./Helper/functions");
const { Telegraf, Markup } = require("telegraf");
const axios = require('axios');

//-------------firebase-----------------
const admin = require('firebase-admin');
const serviceAccount = require('/home/runner/lumina-ai/lumina-ai-7d702-firebase-adminsdk-tltpt-c5a63e7ad4.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://lumina-ai-7d702-default-rtdb.firebaseio.com/'
});
//-----------end---------------------------
const authorizedUserIds = process.env.admin.split(',');
const configuration = new Configuration({
  apiKey: process.env.API,
});
const openai = new OpenAIApi(configuration);
module.exports = openai;

const bot = new Telegraf(process.env.TG_API);

async function getChatResponse(text) {
  try {
    const url = 'https://api.pawan.krd/v1/chat/completions';
    const headers = {
      'Authorization': 'Bearer pk-ryYYQyrzRmoKTJvgJuelBBqhoMmsEnVkezIzOKNaeXwFSwXN',
      'Content-Type': 'application/json'
    };
    const data = {
      "model": "pai-001-light",
      "max_tokens": 1000,
      "messages": [
        {
          "role": "system",
          "content": "You are a helpful assistant."
        },
        {
          "role": "user",
          "content": text
        }
      ]
    };

    const response = await axios.post(url, data, { headers });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('No response or invalid response from GPT API');
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    console.error('Error JSON:', JSON.stringify(error.response.data, null, 2));
  }
}

bot.command('start', async (ctx) => {
  const firstName = ctx.message.from.first_name;
  const userId = ctx.from.id.toString();
  const userRef = admin.database().ref('broadcastUsers');
  const snapshot = await userRef.child(userId).once('value');
  const welcomeText = `
<u>Hi ${firstName}, Welcome to Lumina Ai Bot!</u>

At Lumina Ai, we believe in the limitless potential of artificial intelligence to transform the way we work, learn, and interact with technology. Our platform is designed to provide you with an exceptional AI-powered experience that combines cutting-edge capabilities with user-friendly interactions.

<u>Why Choose Lumina Ai:</u>
1. Seamless Communication: With Lumina Ai, you're not just interacting with an AI; you're engaging with a smart, understanding entity that comprehends your needs and adapts to your preferences.
2. Diverse Expertise: Our AI's extensive training allows it to assist across a wide range of topics, from answering questions and providing explanations to generating creative content and more.
3. Productivity Enhancement: Whether you're a student looking for research insights or a professional aiming to streamline your workflow, Lumina Ai is your AI co-pilot for boosting productivity.
4. Personalized Interactions: Experience a tailored engagement as the AI learns from your interactions, making conversations more natural and relevant over time.
5. Language Mastery: Lumina Ai effortlessly communicates in multiple languages, breaking down language barriers to provide global access to AI assistance.
6. Innovative Problem Solving: Stuck on a challenge? Lumina Ai's analytical capabilities and problem-solving skills can provide fresh perspectives and solutions.
7. Evolving Knowledge: Our AI is trained on up-to-date information until September 2021, ensuring it's equipped with the latest insights and understanding.
8. Educational Partner: Whether you're a student, educator, or lifelong learner, Lumina Ai is an ideal companion for learning new concepts, getting explanations, and expanding your horizons.
9. Safe and Secure: Your privacy and data security are our top priorities. You can confidently explore and interact with Lumina Ai knowing that your information is protected.

<u>Exclusive Features:</u>
- Realtime Weather Tracking
- Advanced Search Filters: Easily find relevant information by utilizing our powerful search filters, refining results to match your specific needs.
- 24/7 Server Hosting: Enjoy uninterrupted access to Lumina Ai's capabilities with our round-the-clock server hosting, ensuring a seamless experience anytime you need assistance.
- Minimal Offline Periods: We've optimized our system to minimize offline periods, so you can rely on Lumina Ai's support whenever you need it, day or night.
- Lightning-Fast Responses: Experience the speed of technology at its best. Our AI responds promptly, ensuring you get the information you need without delays.
- Free Version Availability: Access to AI assistance shouldn't be limited. We offer a free version of Lumina Ai with essential features, making our platform accessible to everyone.
`;
  if (!snapshot.exists()) {
    // Add the user ID to Firebase if not already present
    userRef.child(userId).set(true);
  } else {
    ctx.replyWithHTML(welcomeText);
  }
});

bot.command('send', async (ctx) => {
  const senderUserId = ctx.from.id.toString();

  if (!authorizedUserIds.includes(senderUserId)) {
    ctx.reply("Sorry, you're not authorized to use this command.");
    return;
  }

  const replyMessage = ctx.message.reply_to_message;

  if (!replyMessage || replyMessage.from.id.toString() !== senderUserId) {
    ctx.reply('Please reply with the message, image, or video you want to broadcast.');
    return;
  }

  let messageToBroadcast;

  if (replyMessage.text) {
    messageToBroadcast = { text: replyMessage.text };
  } else if (replyMessage.photo) {
    const photo = replyMessage.photo[replyMessage.photo.length - 1];
    const caption = replyMessage.caption || '';
    messageToBroadcast = { photo: photo.file_id, caption: caption };
  } else if (replyMessage.video) {
    const video = replyMessage.video;
    const caption = replyMessage.caption || '';
    messageToBroadcast = { video: video.file_id, caption: caption };
  } else {
    ctx.reply("Unsupported message type. Please reply with text, image, or video.");
    return;
  }

  const userRef = admin.database().ref('broadcastUsers');
  const snapshot = await userRef.once('value');
  const userIds = Object.keys(snapshot.val() || []);

  userIds.forEach(userId => {
    if (messageToBroadcast.text) {
      bot.telegram.sendMessage(userId, messageToBroadcast.text);
    } else if (messageToBroadcast.photo) {
      bot.telegram.sendPhoto(userId, messageToBroadcast.photo, { caption: messageToBroadcast.caption });
    } else if (messageToBroadcast.video) {
      bot.telegram.sendVideo(userId, messageToBroadcast.video, { caption: messageToBroadcast.caption });
    }
  });

  ctx.reply('Message broadcasted to all users!');
});

bot.help((ctx) => {
  ctx.reply(
    "This bot can perform the following command \n /image -> to create image from text \n /ask -> ank anything from me \n\n Example: /ask write me a story about willy wonka"
  );
});
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text.toLowerCase();

  // Detect keywords for weather queries
  if (userMessage.includes('weather') || userMessage.includes('cuaca')) {
    const apiKey = '356b928b1767dada139ad0e400dbb3de';
    const city = 'Kapit'; //Weather City check by darwin
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
      const response = await axios.get(apiUrl);
      const weather = response.data.weather[0].description;
      const temperature = response.data.main.temp;

      const weatherMessage = `Current weather in ${city}: ${weather}, Temperature: ${temperature}°C`;
      ctx.reply(weatherMessage);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      ctx.reply('Sorry, I couldn\'t fetch the weather data at the moment.');
    }
  } else if (userMessage.includes('hai lumina') || userMessage.includes('hi lumina')) {
    const text = userMessage.replace('hai lumina', '').replace('hi lumina', '').trim();

    if (text) {
      try {
        ctx.sendChatAction('typing');
        const res = await getChatResponse(text);
        if (res) {
          const replyText = `${res}\n\n------------------------\nPowered By @LuminaAiBot`;
          const keyboard = {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Share', switch_inline_query: 'Check out this bot!' }],
              ],
            }),
          };

          ctx.telegram.sendMessage(ctx.message.chat.id, replyText, {
            reply_to_message_id: ctx.message.message_id,
            ...keyboard,
          });
        } else {
          ctx.telegram.sendMessage(
            ctx.message.chat.id,
            'An error occurred while processing your request.',
            {
              reply_to_message_id: ctx.message.message_id,
            }
          );
        }
      } catch (error) {
        console.error('Error in /ask command:', error);
        ctx.telegram.sendMessage(
          ctx.message.chat.id,
          'An error occurred while processing your request.',
          {
            reply_to_message_id: ctx.message.message_id,
          }
        );
      }
    } else {
      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        'Please ask me question after "hi lumina" or "hai lumina"\n\nExample: Hai lumina how are you?',
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
    }
  } else if (userMessage.includes('gambar') || userMessage.includes('picture')) {
    // Run the /image command
    const text = userMessage.replace('gambar', '').replace('picture', '').trim();
    if (text) {
      try {
        const res = await getImage(text);

        if (res) {
          ctx.sendChatAction("upload_photo");
          ctx.telegram.sendPhoto(ctx.message.chat.id, res, {
            reply_to_message_id: ctx.message.message_id,
          });
        } else {
          ctx.telegram.sendMessage(
            ctx.message.chat.id,
            "An error occurred while processing your request.",
            {
              reply_to_message_id: ctx.message.message_id,
            }
          );
        }
      } catch (error) {
        console.error("Error in /image command:", error);
        ctx.telegram.sendMessage(
          ctx.message.chat.id,
          "An error occurred while processing your request.",
          {
            reply_to_message_id: ctx.message.message_id,
          }
        );
      }
    } else {
      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        "You have to give some description after /image",
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
    }
  }
});




bot.launch()
  .then(() => {
    console.log('Lumina Ai Online!');
  })
  .catch((error) => {
    console.error('Error launching Lumina Ai:', error);
  });