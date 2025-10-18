# PreAid - Your Personal Health Companion 🏥

A modern, AI-powered health assistant with user authentication and persistent history storage. Built with a human-centered design approach.

## ✨ Features

- **🤖 AI Health Advice**: Powered by Google Gemini 1.5-Flash
- **👤 User Authentication**: Secure login/register system
- **🎭 Guest Mode**: Try without creating an account
- **📱 Modern UI**: Human-friendly design with dark/light themes
- **🎤 Voice Input**: Speak your symptoms naturally
- **📋 History Management**: Save and access past consultations
- **🔒 Secure**: Local storage with user-specific data
- **☁️ Cloud Ready**: Deployed on Vercel
- **🚨 Safety Warnings**: Targeted warnings for high-risk procedures
- **🇮🇳 India-Specific**: Emergency numbers and context for India

## 🚀 Live Demo

Visit: [https://your-app-name.vercel.app](https://your-app-name.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: Google Gemini 1.5-Flash API
- **Storage**: localStorage (client-side)
- **Deployment**: Vercel
- **Authentication**: Client-side with localStorage

## 📦 Quick Deploy to Vercel

1. **Fork this repository**

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `GEMINI_API_KEY`

3. **Deploy**
   - Click Deploy
   - Your app will be live instantly!

## 🔧 Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd preaid-health-assistant

# Install Vercel CLI (optional)
npm i -g vercel

# Start development server
vercel dev
# OR simply open index.html in browser
```

## 🌟 Key Features Explained

### 🧠 Contextual History Analysis
- Tracks personal vs. other-person symptoms
- Time-based filtering (7 days for minor, 3 months for surgery)
- Symptom progression detection (nosebleed → dizziness)
- Impact-based relevance (surgery more relevant than flu)

### 🚨 Safety System
- Targeted warnings for high-risk procedures
- India-specific emergency numbers (108, 102, 100, 101)
- Warnings appear at top of responses
- Only for dangerous procedures (CPR, choking, etc.)

### 🎤 Advanced Speech Features
- Natural voice selection with priority system
- Medical text preprocessing for better pronunciation
- Adjustable speech speed with persistence
- Pause/resume functionality

### 👤 User Management
- Persistent login across browser sessions
- User-specific history storage
- Guest mode for privacy
- Clean session management

## 📱 Supported Features

- ✅ Voice input (Web Speech API)
- ✅ Text-to-speech with natural voices
- ✅ Dark/light theme toggle
- ✅ Responsive design (mobile-friendly)
- ✅ Offline mode with basic advice
- ✅ Chat history management
- ✅ Copy/share functionality
- ✅ Safety warnings for high-risk procedures

## 🔒 Privacy & Security

- All data stored locally in browser
- No server-side user data storage
- Secure API key handling
- XSS and injection prevention
- HTTPS enforced on Vercel

## 🚀 Deployment Steps

### Method 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/preaid-health-assistant)

### Method 2: Manual Deploy
1. Push code to GitHub
2. Connect repository to Vercel
3. Add `GEMINI_API_KEY` environment variable
4. Deploy automatically

## 🌍 Environment Variables

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

## 📞 Emergency Numbers (India)

- **National Emergency**: 108
- **Ambulance**: 102
- **Police**: 100
- **Fire**: 101

## ⚠️ Medical Disclaimer

This application provides AI-generated health information for educational purposes only. Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment.

## 📄 License

MIT License - feel free to use for personal and commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

**Built with ❤️ for better healthcare accessibility**