import express, { Request, Response, Router } from 'express';
import postUser from '../controllers/postUser';
import getUser from '../controllers/getUser';
import patchUser from '../controllers/patchUser';
import deleteUser from '../controllers/deleteUser';

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

router.post('/', async (req: Request, res: Response) => {
  try {
    await postUser(req, res);
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

router.delete('/:referensnummer', async (req: Request, res: Response) => {
  try {
    await deleteUser(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
});

export default router;
