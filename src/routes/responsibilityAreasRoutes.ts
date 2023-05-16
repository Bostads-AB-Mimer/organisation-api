import express, { Request, Response, Router } from 'express';
import getResponsibilityAreas from '../controllers/getResponsibilityAreas';
import deleteResponsibilityRelationship from '../controllers/deleteResponsibilityRelationship';
import postResponsibilityRelationship from '../controllers/postResponsibilityRelationship';

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

router.post('/', async (req: Request, res: Response) => {
  try {
    await postResponsibilityRelationship(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
});

router.delete('/', async (req: Request, res: Response) => {
  try {
    await deleteResponsibilityRelationship(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
});

export default router;
