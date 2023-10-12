import express, { Request, Response, Router, NextFunction } from 'express';
import {
  getResponsibilityAreas,
  postResponsibilityRelationship,
  deleteResponsibilityRelationship,
} from '../../controllers/v1/responsibilityAreasController';
import { errorHandler } from '../../middleware/error-handler';

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/responsibilityareas:
 *   get:
 *     summary: Retrieve a list of responsibility areas
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Responsibility Areas
 *     parameters:
 *       - in: query
 *         name: costPool
 *         schema:
 *           type: string
 *         description: The costPool id to filter by
 *     responses:
 *       '200':
 *         description: A list of responsibility areas.
 *         content:
 *           application/json:
 *             schema:
 *               type: 'array'
 *               items:
 *                 $ref: '#/components/schemas/ResponsibilityArea'
 *   post:
 *     summary: Create a new responsibility area relationship
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Responsibility Areas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             properties:
 *               employeeId:
 *                 type: 'string'
 *               responsibilityAreaNr:  
 *                 type: 'string'
 *     responses:
 *       '201':
 *         description: The created responsibility area relationship.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponsibilityArea'
 *   delete:
 *     summary: Delete a responsibility area relationship
 *     security:
 *       - ApiKeyAuth: []
 *     tags:
 *       - Responsibility Areas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             properties:
 *               employeeId:
 *                 type: 'string'
 *               responsibilityAreaNr:  
 *                 type: 'string'
 *     responses:
 *       '204':
 *         description: Successfully deleted responsibility area relationship.
 */
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
