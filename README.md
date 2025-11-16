# USDA Chatbot

A beautiful, production-ready chatbot interface for querying USDA Rural Development programs. Built with React, TypeScript, Tailwind CSS, and Supabase.

## 📁 Project Structure

```
usda-chatbot/
├── src/
│   ├── App.tsx          (Main chatbot component)
│   ├── main.tsx         (Entry point)
│   └── index.css        (Tailwind imports)
├── index.html           (HTML template)
├── package.json         (Dependencies)
├── vite.config.ts       (Vite config)
├── tailwind.config.js   (Tailwind config)
├── tsconfig.json        (TypeScript config)
├── tsconfig.app.json    (TypeScript app config)
└── .env                 (Environment variables)
```

## 🚀 Setup Instructions

### 1. Clone or download the project

```bash
git clone <your-repo-url>
cd usda-chatbot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for production

```bash
npm run build
```

## 🎨 Customization Tips

### Colors

You can customize the chatbot colors by editing `src/App.tsx`:

- **Header background**: Line 198 - `from-slate-800 to-slate-700`
- **User messages**: Line 238 - `bg-green-700`
- **Bot avatar**: Line 224 - `bg-slate-800`
- **Background gradient**: Line 183 - `from-blue-400 to-blue-100`

### Text Content

- **Welcome message**: Lines 42-43
- **USDA keywords**: Lines 24-34 - Add or remove keywords to improve search

### Layout

- **Chat height**: Line 196 - `height: '600px'`
- **Max width**: Line 195 - `max-w-md`
- **Avatar size**: Line 224 - `w-10 h-10`

## 🗄️ Database Structure

The chatbot queries a Supabase database with the following table:

### `usda_programs` table

| Column | Type | Description |
|--------|------|-------------|
| title | text | Program name |
| description | text | Program description |
| url | text | Link to program details |
| category | text | Program category |

## 📝 Features

- **Smart keyword detection**: Automatically detects USDA-related topics
- **Database search**: Queries Supabase for relevant programs
- **Conversational responses**: Provides helpful, contextual answers
- **Floating widget**: Can be opened and closed
- **Responsive design**: Works on all screen sizes
- **Loading states**: Animated indicators for better UX
- **Error handling**: Graceful error messages

## 🛠️ Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Database and backend
- **Lucide React** - Icons

## 📦 Dependencies

### Production
- `@supabase/supabase-js` - Supabase client
- `lucide-react` - Icon library
- `react` & `react-dom` - React framework

### Development
- `@vitejs/plugin-react` - Vite React plugin
- `tailwindcss` - CSS framework
- `typescript` - TypeScript compiler
- `autoprefixer` & `postcss` - CSS processing

## 🎯 How It Works

1. **User Input**: User types a question about USDA programs
2. **Keyword Extraction**: System extracts relevant keywords from the query
3. **Database Search**: Searches the `usda_programs` table using extracted keywords
4. **Response Generation**: Creates a conversational response with matching programs
5. **Display**: Shows formatted results with program details and links

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your Supabase keys secure
- Use Row Level Security (RLS) policies in Supabase for production

## 📄 License

MIT License - Feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or issues, please open an issue on GitHub.
