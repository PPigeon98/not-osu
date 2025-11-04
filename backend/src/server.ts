import dotenv from 'dotenv';
import express, { json, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config';

import {
  ErrorObject
} from './interface';
import { echo } from './echo';

dotenv.config();

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));

// connectDB(); - uncomment once MONGO_URI set up

const PORT: number = parseInt(process.env.PORT || '5000');
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================

function handleFunction(func: () => unknown, res: Response) {
  try {
    res.status(200).json(func());
  } catch (error) {
    const errorObj : ErrorObject = {
      error: error instanceof Error ? error.message : String(error)
    };
    return res.status(400).json(errorObj);
  }
}

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const value = req.query.value as string;

  handleFunction(() => echo(value), res);
});

// ====================================================================

// --------------------- ADD NEW ROUTES BELOW -------------------------



// --------------------- ADD NEW ROUTES ABOVE -------------------------

// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
