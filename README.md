# iResults - iRacing Discord Bot

iResults is a Discord bot that automatically tracks and publishes iRacing race results for specified drivers. Get real-time updates when tracked drivers finish their races, including detailed statistics like iRating changes, Safety Rating, and more.

![iResults_embed](https://github.com/user-attachments/assets/29f5c185-66b8-48ea-b475-eeaa1d249e11)



## Features

- 🏎 **Automatic Race Result Tracking**: Get notifications when tracked drivers finish their races
- 📊 **Detailed Statistics**: View comprehensive race statistics including:
  - Start and finish positions
  - iRating changes
  - Safety Rating updates
  - License class information
  - Incident points
  - Strength of field
- 🔔 **Channel Configuration**: Set specific channels for race result notifications
- 🎮 **Multiple Driver Tracking**: Track multiple drivers across different Discord servers
- 🔗 **Direct Links**: Quick access to full race results on iRacing.com

## Commands

- `/lastrace customer_id:<id>` - Get the last race results for a specific iRacing member
- `/setchannel channel:<#channel>` - Set the channel for automatic race result publication
- `/trackmember customer_id:<id>` - Track race results for a specified iRacing member
- `/help` - Display help information and command usage

## Quick Start - Using the Hosted Bot

If you want to use the already hosted version of iResults:

1. Click this link to invite the bot: [Invite iResults Bot]([https://discord.com/api/oauth2/authorize?client_id=1320895408305868881&permissions=2147485696&scope=bot%20applications.commands](https://discord.com/api/oauth2/authorize?client_id=1320895408305868881&permissions=37080064&scope=bot%20applications.commands))
2. Select your Discord server from the dropdown
3. Click "Authorize"
4. Set the results channel
5. Add members to track

## Finding Your iRacing Customer ID

1. Log in to your iRacing account
2. Click on your helmet icon in the top-right corner
3. Your Customer ID will be displayed at the top of the window: `My Account: Customer ID #123456`

That's it! You can now use the bot without any additional setup.

## Self-Hosting

If you want to host your own instance of the bot:

### Prerequisites

- Node.js 16.9.0 or higher
- An iRacing account
- A Discord account with permission to add bots to servers
- A server or computer to host the bot 24/7

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/iResults.git
cd iResults
```

2. Install dependencies:
```bash
npm install
```

3. Create a `data/config.json` file with your configuration:
```json
{
  "token": "your-discord-bot-token",
  "iracingEmail": "your-iracing-email",
  "iracingPassword": "your-iracing-password"
}
```

4. Set up your Discord Application:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" section and click "Add Bot"
   - Copy the bot token and add it to your `config.json`
   - Under "Privileged Gateway Intents", enable:
     - Server Members Intent
     - Message Content Intent

5. Start the bot:
```bash
npm start
```

6. Invite your instance to servers:
   - In the Discord Developer Portal, go to "OAuth2" > "URL Generator"
   - In "Scopes", select "bot" and "applications.commands"
   - In "Bot Permissions", select:
     - Read Messages/View Channels
     - Send Messages
     - Embed Links
   - Copy the generated URL and open it in a browser to invite your bot instance

### Hosting Recommendations

For 24/7 operation, consider hosting your bot on:
- A VPS (Virtual Private Server)
- A dedicated server
- A cloud service provider (AWS, Google Cloud, DigitalOcean, etc.)

Remember to keep your config.json secure and never share your bot token or iRacing credentials.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the existing issues in the GitHub repository
2. Create a new issue if your problem isn't already reported
3. Include as much detail as possible in bug reports

## Acknowledgments

- Thanks to iRacing for providing the API
- Thanks to the Discord.js team for their excellent library

## Disclaimer

This bot is not affiliated with or endorsed by iRacing. All trademarks are the property of their respective owners.
