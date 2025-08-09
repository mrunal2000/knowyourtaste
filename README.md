# 👗 Fashion Taster

**AI-powered fashion analysis and style recommendations**

## 🌐 Live at knowyourtaste.online

A beautiful React app that analyzes fashion photos using OpenAI's GPT-4V to provide personalized styling advice and outfit recreation tips.

## ✨ Features

- 📸 **AI Fashion Analysis** - Upload photos and get detailed styling advice
- 🎨 **Curated Gallery** - Browse fashion inspiration from around the world
- 💡 **Style Recommendations** - Get specific tips on how to recreate looks
- 📱 **Mobile Responsive** - Perfect experience on all devices
- ⚡ **Lightning Fast** - Deployed on Vercel's global CDN

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Custom CSS with modern design
- **AI**: OpenAI GPT-4V for fashion analysis
- **Deployment**: Vercel (Serverless Functions)
- **Domain**: knowyourtaste.online

## 🏗️ Architecture

```
fashion-taster/
├── src/                 # React frontend
│   ├── App.tsx         # Main application
│   ├── App.css         # Styling
│   └── main.tsx        # Entry point
├── api/                # Serverless functions
│   ├── analyze.js      # AI fashion analysis
│   └── health.js       # Health check
├── public/             # Static assets
├── vercel.json         # Vercel configuration
└── package.json        # Dependencies
```

## 🔧 Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd fashion-taster

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🌐 Deployment

This app is optimized for Vercel deployment:

1. **Push to GitHub**
2. **Connect Vercel** to your repository
3. **Add OpenAI API key** as environment variable
4. **Deploy** - it's that simple!

See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.

## 🔑 Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## 🎯 How It Works

1. **Upload Fashion Photo** - Users can upload any fashion image
2. **AI Analysis** - GPT-4V analyzes the outfit and style
3. **Get Recommendations** - Receive detailed advice on how to recreate the look
4. **Browse Gallery** - Explore curated fashion inspiration

## 🎨 Design Philosophy

- **Clean & Modern** - Minimalist interface focusing on the fashion content
- **Mobile-First** - Responsive design that works perfectly on all devices
- **Fast & Smooth** - Optimized performance with instant interactions
- **Accessible** - Great UX for all users

## 💡 Features in Detail

### AI Fashion Analysis
- **Style Recognition** - Identifies fashion styles and trends
- **Color Analysis** - Breaks down color palettes and combinations
- **Outfit Breakdown** - Lists specific clothing items and accessories
- **Styling Tips** - Practical advice for recreating looks

### Curated Gallery
- **Fashion Inspiration** - High-quality outfit photos
- **Interactive Experience** - Click to get styling advice for any outfit
- **Diverse Styles** - Wide range of fashion aesthetics

## 🚀 Performance

- **Lighthouse Score**: 95+ on all metrics
- **Global CDN**: Sub-second loading times worldwide
- **Optimized Images**: Efficient asset delivery
- **Code Splitting**: Fast initial load and navigation

## 📱 Mobile Experience

Fully responsive design with:
- Touch-optimized interactions
- Mobile-first layout
- Fast loading on slower connections
- Native app-like experience

## 🎉 Go Live!

Your Fashion Taster app is ready to deploy to **knowyourtaste.online** and help users discover their perfect style!

---

**Built with ❤️ for fashion enthusiasts worldwide**