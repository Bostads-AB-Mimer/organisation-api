import express, { Request, Response, Router, NextFunction } from 'express';
import { getCostPools } from '../../controllers/v1/costPoolsController';
import { errorHandler } from '../../middleware/error-handler';

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/costpools:
 *   get:
 *     summary: Retrieve a list of properties
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - CostPools
 *     description: Returns all costpools
 *     responses:
 *       200:
 *         description: A list of costpools
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CostPool'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await getCostPools(req, res, next);
});

// Use error handling middleware
router.use(errorHandler);

export default router;
