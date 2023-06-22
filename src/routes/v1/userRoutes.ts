import express, { Request, Response, Router, NextFunction } from 'express';
import { getUser, triggerUserSync } from '../../controllers/v1/userController';
import { errorHandler } from '../../middleware/error-handler';

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags:
 *       - Users
 *     description: Returns all users
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: jobTitle
 *         schema:
 *           type: string
 *         description: Job title of the users to filter
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  await getUser(req, res, next);
});

/**
 * @swagger
 * /api/v1/users/sync:
 *   post:
 *     summary: Trigger users data sync
 *     tags:
 *       - Users
 *     description: Trigger syncing of user data from external source
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Successfully triggered data sync
 */
router.post(
  '/sync',
  async (req: Request, res: Response, next: NextFunction) => {
    await triggerUserSync(req, res, next);
  }
);

// Use error handling middleware
router.use(errorHandler);

export default router;
