import 'dotenv/config';


const url = `https://discord.com/api/v10/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`;

// This is an example CHAT_INPUT or Slash Command, with a type of 1
const command = {
    "name": "blep",
    "type": 1,
    "description": "Send a random adorable animal photo",
    "options": [
        {
            "name": "animal",
            "description": "The type of animal",
            "type": 3,
            "required": true,
            "choices": [
                {
                    "name": "Dog",
                    "value": "animal_dog"
                },
                {
                    "name": "Cat",
                    "value": "animal_cat"
                },
                {
                    "name": "Penguin",
                    "value": "animal_penguin"
                }
            ]
        }
    ]
};


const response = await fetch(url, {
    method: 'POST',
    headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
});

if (response.ok) {
    console.log('Commande /blep enregistrée !');
} else {
    console.error('Erreur Discord :', await response.json());
    process.exitCode = 1;
}
