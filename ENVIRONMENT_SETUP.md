# 🔑 Environment Variables Setup

The YAML Diagram Visualizer supports loading the OpenAI API key from environment variables for better security and convenience.

## 🚀 Quick Setup

### 1. **Create Environment File**
Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

### 2. **Add Your API Key**
Edit the `.env` file and add your OpenAI API key:

```env
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. **Restart Development Server**
```bash
npm run dev
```

## 🔒 Security Features

### **Environment Variable Priority**
The application loads API keys in this order:
1. **Environment Variable** (`VITE_OPENAI_API_KEY`) - **Recommended**
2. **LocalStorage** (user-entered keys)
3. **Mock Responses** (fallback)

### **Benefits of Environment Variables**
- ✅ **Security**: API key not exposed in browser storage
- ✅ **Convenience**: Automatic loading on app start
- ✅ **Team Sharing**: Consistent setup across team members
- ✅ **Production Ready**: Proper deployment configuration

## 📋 Usage

### **With Environment Variable**
```env
# .env file
VITE_OPENAI_API_KEY=sk-1234567890abcdef...
```

**Status Display**: `✅ OpenAI Connected (Environment)`

### **With Manual Entry**
Click **🔑 Add API Key** button in AI Assistant

**Status Display**: `✅ OpenAI Connected (Local)`

### **Without API Key**
**Status Display**: `⚠️ Using Mock Responses`

## 🛠️ Configuration Options

### **For Development**
```env
# .env (not committed to git)
VITE_OPENAI_API_KEY=sk-your-development-key
```

### **For Production**
Set environment variable in your hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables  
- **Docker**: `-e VITE_OPENAI_API_KEY=sk-...`

## 🔧 Troubleshooting

### **Key Not Loading**
1. Ensure variable starts with `VITE_` prefix
2. Restart development server after adding .env
3. Check .env file is in project root
4. Verify no syntax errors in .env file

### **Environment vs Local Keys**
- Environment variables **override** localStorage
- To use localStorage, remove from .env file
- Environment keys cannot be cleared via UI

## 🎯 Example Workflows

### **Team Development**
1. Share `.env.example` in repository
2. Each developer copies to `.env`
3. Add individual API keys
4. Consistent experience across team

### **CI/CD Pipeline**
```yaml
# GitHub Actions example
env:
  VITE_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### **Local Testing**
```bash
# Test with temporary key
VITE_OPENAI_API_KEY=sk-test-key npm run dev
```

---

**🔐 Remember**: Never commit `.env` files to version control. They're automatically ignored via `.gitignore`.