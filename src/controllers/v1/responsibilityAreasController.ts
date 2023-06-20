import { Request, Response, NextFunction } from 'express';
import { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../../config/db';

export const getResponsibilityAreas = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let session: Session | null = null;
  try {
    const costPool: string | undefined = req.query.costPool as string;

    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();

    if (costPool) {
      const costPoolQuery =
        'MATCH (c:CostPool) WHERE c.id = $costPool RETURN c';
      const costPoolResult = await session.run(costPoolQuery, {
        costPool,
      });

      if (costPoolResult.records.length === 0) {
        res.status(400).json({ error: 'No such costPool.' });
        return;
      }

      const query =
        'MATCH (ra:ResponsibilityArea)-[r]->(c:CostPool) WHERE c.id = $costPool RETURN ra';
      const result = await session.run(query, { costPool });
      const records = result.records.map((record: Record) => {
        const ra = record.get('ra');
        return {
          id: ra.identity.toNumber(),
          responsibilityArea: ra.properties.id,
        };
      });

      res.json(records);
    } else {
      const query = 'MATCH (ra:ResponsibilityArea) RETURN ra';
      const result = await session.run(query);
      const records = result.records.map((record: Record) => {
        const ra = record.get('ra');
        return {
          id: ra.identity.toNumber(),
          responsibilityArea: ra.properties.id,
        };
      });

      res.json(records);
    }
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      session.close();
    }
  }
};

export const postResponsibilityRelationship = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let session: Session | null = null;
  try {
    const employeeId: string | undefined = req.body.employeeId;
    const responsibilityArea: string | undefined = req.body.responsibilityArea;
    const jobTitle: string | undefined = req.body.jobTitle;

    if (!employeeId || !responsibilityArea || !jobTitle) {
      res.status(400).json({
        error: 'employeeId, jobTitle, and responsibilityArea are all required.',
      });
      return;
    }

    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();

    const responsibilityAreaQuery = `MATCH (ra:ResponsibilityArea)-[:BELONGS_TO]->(c:CostPool) WHERE ra.id = $responsibilityArea RETURN c.id as costPoolId`;
    const responsibilityAreaResult = await session.run(
      responsibilityAreaQuery,
      { responsibilityArea }
    );
    const costPoolId = responsibilityAreaResult.records[0]?.get('costPoolId');
    if (!costPoolId) {
      res.status(400).json({
        error:
          'ResponsibilityArea node with the given id does not belong to any CostPool in the database.',
      });
      return;
    }

    const deleteExistingRelationshipsQuery = `
      MATCH (u:User)-[r:BELONGS_TO]->(:ResponsibilityArea), (u)-[r2:BELONGS_TO]->(:CostPool) 
      WHERE u.employeeId = $employeeId
      DELETE r, r2
    `;
    await session.run(deleteExistingRelationshipsQuery, { employeeId });

    const createRelationshipQuery = `
      MATCH (u:User)-[:WORKS_AS]->(j:JobTitle), (ra:ResponsibilityArea), (c:CostPool)
      WHERE u.employeeId = $employeeId AND j.title = $jobTitle AND ra.id = $responsibilityArea AND c.id = $costPoolId
      MERGE (u)-[:BELONGS_TO]->(ra)
      MERGE (u)-[:BELONGS_TO]->(c)
    `;
    await session.run(createRelationshipQuery, {
      employeeId,
      responsibilityArea,
      costPoolId,
      jobTitle,
    });

    res.status(200).json({
      message: `Relationships created between User with employeeId '${employeeId}' working as '${jobTitle}' and ResponsibilityArea with id '${responsibilityArea}', as well as between User and CostPool with id '${costPoolId}'.`,
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      session.close();
    }
  }
};

export const deleteResponsibilityRelationship = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let session: Session | null = null;
  try {
    const employeeId: string | undefined = req.body.employeeId;
    const responsibilityArea: string | undefined = req.body.responsibilityArea;
    const jobTitle: string | undefined = req.body.jobTitle;

    if (!employeeId || !responsibilityArea || !jobTitle) {
      res.status(400).json({
        error: 'employeeId, jobTitle, and responsibilityArea are all required.',
      });
      return;
    }

    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();

    const responsibilityAreaQuery = `MATCH (ra:ResponsibilityArea)-[:BELONGS_TO]->(c:CostPool) WHERE ra.id = $responsibilityArea RETURN c.id as costPoolId`;
    const responsibilityAreaResult = await session.run(
      responsibilityAreaQuery,
      { responsibilityArea }
    );
    const costPoolId = responsibilityAreaResult.records[0]?.get('costPoolId');
    if (!costPoolId) {
      res.status(400).json({
        error:
          'ResponsibilityArea node with the given id does not belong to any CostPool in the database.',
      });
      return;
    }

    const deleteExistingRelationshipsQuery = `
      MATCH (u:User)-[r:BELONGS_TO]->(:ResponsibilityArea), (u)-[r2:BELONGS_TO]->(:CostPool) 
      WHERE u.employeeId = $employeeId
      DELETE r, r2
    `;
    await session.run(deleteExistingRelationshipsQuery, { employeeId });

    res.status(200).json({
      message: `Relationships deleted for User with employeeId '${employeeId}' and ResponsibilityArea with id '${responsibilityArea}', as well as between User and CostPool with id '${costPoolId}'.`,
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      session.close();
    }
  }
};
