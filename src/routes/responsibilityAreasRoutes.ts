import express, { Request, Response, Router, NextFunction } from 'express';
import {
  getResponsibilityAreas,
  postResponsibilityRelationship,
  deleteResponsibilityRelationship,
} from '../controllers/responsibilityAreasController';
import { errorHandler } from '../middleware/error-handler';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await getResponsibilityAreas(req, res, next);
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  await postResponsibilityRelationship(req, res, next);
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  await deleteResponsibilityRelationship(req, res, next);
});

// Use error handling middleware
router.use(errorHandler);

export default router;
