bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text.toLowerCase();

    // Detect keywords for weather queries
    if (userMessage.includes('weather') || userMessage.includes('cuaca')) {
        const apiKey = '356b928b1767dada139ad0e400dbb3de';
        const city = 'Kapit'; //city set var
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
        } //Set Location To Kapit
    } else if (userMessage.includes('hai lumina') || userMessage.includes('hi lumina')) {
        const text = userMessage.replace('hai lumina', '').replace('hi lumina', '').trim();

        if (text) {
            try {
                ctx.sendChatAction('typing');
                const res = await getChat(text);
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
                'Please ask anything after /ask',
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