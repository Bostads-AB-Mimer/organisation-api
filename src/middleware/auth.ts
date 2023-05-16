import { Request, Response, NextFunction } from 'express';

const apiKeyFromSecrets: string | undefined = process.env.APP_API_KEY;

const auth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (
    !apiKey ||
    !apiKeyFromSecrets ||
    typeof apiKey !== 'string' ||
    apiKey.trim() !== apiKeyFromSecrets.trim()
  ) {
    res.status(401).json({ msg: 'Invalid API key' });
  } else {
    next();
  }
};

export default auth;
