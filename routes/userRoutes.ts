import express, { Request, Response, Router } from 'express';
import getUser from '../src/controllers/getUser';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await getUser(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
});

export default router;
