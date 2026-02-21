import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV || 'development';
dotenv.config({ path: `./config/config.${NODE_ENV}.env` });

import { app } from './app';

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`ThoughtNet API running on port ${PORT} [${NODE_ENV}]`);
});
