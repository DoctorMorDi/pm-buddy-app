# PM Buddy

PM Buddy is a project management application that leverages React, Supabase, and OpenAI to deliver a real-time, efficient project management experience. This repository contains the codebase for both the frontend and backend components.

## Features

- Interactive chat interface with OpenAI integration
- Custom project management knowledge base
- Authentication with Supabase
- Connection status monitoring
- Document management for project files
- Custom instructions for AI assistant behavior

## Project Structure

The project is organized into two main directories:

- `frontend`: React application with TypeScript
- `backend`: Supabase edge functions

## Development Mode

The application includes a special development mode that provides mock API responses when Supabase connectivity isn't available or when CORS issues are encountered in local development.

## Getting Started

1. Clone this repository
2. Set up Supabase project and configure environment variables
3. Run the frontend application with `cd frontend && npm start`

## License

MIT