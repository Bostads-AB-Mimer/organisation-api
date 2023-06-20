import express, { Request, Response, Router, NextFunction } from 'express';
import { getProperties } from '../../controllers/v1/propertiesController';
import { errorHandler } from '../../middleware/error-handler';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await getProperties(req, res, next);
});

// Use error handling middleware
router.use(errorHandler);

export default router;
