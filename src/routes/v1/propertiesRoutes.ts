import express, { Request, Response, Router, NextFunction } from 'express';
import { getProperties } from '../../controllers/v1/propertiesController';
import { errorHandler } from '../../middleware/error-handler';

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: Retrieve a list of properties
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Properties
 *     responses:
 *       '200':
 *         description: A list of properties.
 *         content:
 *           application/json:
 *             schema:
 *               type: 'array'
 *               items:
 *                 $ref: '#/components/schemas/Property'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await getProperties(req, res, next);
});

// Use error handling middleware
router.use(errorHandler);

export default router;
