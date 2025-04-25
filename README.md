
# Idrak OCR - Advanced Document Processing Platform

Idrak OCR (from Arabic إدراك meaning "comprehension/perception") is an advanced OCR platform powered by dual AI engines - Gemini and ChatGPT - for unparalleled accuracy in text extraction and data structuring.

![image](https://github.com/user-attachments/assets/64c95439-a80b-46c2-be66-80e8963d97d6)


## Features

- **Dual AI Processing**: Parallel processing with Gemini and ChatGPT ensures the highest possible accuracy in text extraction
- **Result Comparison**: Compare and choose between different AI model results to get the most accurate data extraction
- **Custom AI Prompts**: Fine-tune AI behavior with specific instructions tailored to your document types and extraction needs
- **Batch Processing**: Process multiple documents simultaneously for high-volume data extraction projects
- **Structured Output**: Get consistently formatted data output for seamless integration with your workflows
- **Multilingual Support**: Process documents in multiple languages with high accuracy

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express.js + Node.js
- Database: PostgreSQL with Drizzle ORM
- AI Integration: Google Gemini and OpenAI GPT
- Styling: Tailwind CSS + Radix UI
- Authentication: Passport.js
- File Handling: Multer

## Getting Started

1. Click the "Run" button to start the development server
2. The application will be available at port 5000
3. Create an account to start using the platform
4. Create a new project and upload example documents
5. Test processing with different AI models
6. Deploy for batch processing

## Project Structure

```
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared TypeScript types
└── uploads/         # Document storage
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

