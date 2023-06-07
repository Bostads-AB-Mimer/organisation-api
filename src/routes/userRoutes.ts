import express, { Request, Response, Router } from 'express';
import getUser from '../controllers/getUser';
import patchUser from '../controllers/patchUser';

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

router.patch('/:referensnummer', async (req: Request, res: Response) => {
  try {
    await patchUser(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
});

export default router;
