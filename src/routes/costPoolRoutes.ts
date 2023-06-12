import express, { Request, Response, Router, NextFunction } from 'express';
import { getCostPools } from '../controllers/costPoolsController';
import { errorHandler } from '../middleware/error-handler';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await getCostPools(req, res, next);
});

// Use error handling middleware
router.use(errorHandler);

export default router;
