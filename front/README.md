# Fightboat Frontend

A React-based frontend for the Fightboat game.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Building for Production

```bash
# Build the project
npm run build
```

The built files will be in the `dist` directory.

## Deployment

The project is configured for deployment on static hosting services. The `dist` directory contains the production-ready files.

### Deployment Steps

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the contents of the `dist` directory to your hosting service.

## Environment Variables

The following environment variables can be set:

- `VITE_SERVER_URL` - The URL of the game server (defaults to https://battleship-q6f4.onrender.com) 