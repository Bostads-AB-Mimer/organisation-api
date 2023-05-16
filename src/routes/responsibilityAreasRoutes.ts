import express, { Request, Response, Router } from 'express';
import getResponsibilityAreas from '../controllers/getResponsibilityAreas';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await getResponsibilityAreas(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
});

export default router;
