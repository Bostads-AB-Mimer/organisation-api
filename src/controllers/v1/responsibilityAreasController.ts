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
          neo4jId: ra.identity.toNumber(),
          responsibilityAreaNr: ra.properties.id,
        };
      });

      res.json(records);
    } else {
      const query = 'MATCH (ra:ResponsibilityArea) RETURN ra';
      const result = await session.run(query);
      const records = result.records.map((record: Record) => {
        const ra = record.get('ra');
        return {
          neo4jId: ra.identity.toNumber(),
          responsibilityAreaNr: ra.properties.id,
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
    const responsibilityAreaNr: string | undefined =
      req.body.responsibilityAreaNr;

    if (!employeeId || !responsibilityAreaNr) {
      res.status(400).json({
        error: 'employeeId and responsibilityAreaNr are both required.',
      });
      return;
    }

    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();

    const userExistsQuery = `MATCH (u:User) WHERE u.employeeId = $employeeId RETURN u`;
    const userExistsResult = await session.run(userExistsQuery, { employeeId });
    if (userExistsResult.records.length === 0) {
      res
        .status(400)
        .json({ error: 'User with the provided employeeId does not exist.' });
      return;
    }

    const responsibilityAreaQuery = `MATCH (ra:ResponsibilityArea)-[:BELONGS_TO]->(c:CostPool) WHERE ra.id = $responsibilityAreaNr RETURN c.id as costPoolId`;
    const responsibilityAreaResult = await session.run(
      responsibilityAreaQuery,
      { responsibilityAreaNr }
    );
    const costPoolId = responsibilityAreaResult.records[0]?.get('costPoolId');
    if (!costPoolId) {
      res.status(400).json({
        error:
          'ResponsibilityArea with given responsibilityAreaNr is not connected to any CostPool.',
      });
      return;
    }

    const createRelationshipQuery = `
      MATCH (u:User), (ra:ResponsibilityArea), (c:CostPool)
      WHERE u.employeeId = $employeeId AND ra.id = $responsibilityAreaNr AND c.id = $costPoolId
      MERGE (u)-[:BELONGS_TO]->(ra)
      MERGE (u)-[:BELONGS_TO]->(c)
    `;
    await session.run(createRelationshipQuery, {
      employeeId,
      responsibilityAreaNr,
      costPoolId,
    });

    res.status(200).json({
      message: `Relationships created between User with employeeId '${employeeId}' and ResponsibilityArea with id '${responsibilityAreaNr}', as well as between User and CostPool with id '${costPoolId}'.`,
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
    const responsibilityAreaNr: string | undefined =
      req.body.responsibilityAreaNr;

    if (!employeeId || !responsibilityAreaNr) {
      res.status(400).json({
        error: 'employeeId and responsibilityAreaNr are both required.',
      });
      return;
    }

    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();

    const userExistsQuery = `MATCH (u:User) WHERE u.employeeId = $employeeId RETURN u`;
    const userExistsResult = await session.run(userExistsQuery, { employeeId });
    if (userExistsResult.records.length === 0) {
      res
        .status(400)
        .json({ error: 'User with the provided employeeId does not exist.' });
      return;
    }

    const responsibilityAreaQuery = `MATCH (ra:ResponsibilityArea)-[:BELONGS_TO]->(c:CostPool) WHERE ra.id = $responsibilityAreaNr RETURN c.id as costPoolId`;
    const responsibilityAreaResult = await session.run(
      responsibilityAreaQuery,
      { responsibilityAreaNr }
    );
    const costPoolId = responsibilityAreaResult.records[0]?.get('costPoolId');
    if (!costPoolId) {
      res.status(400).json({
        error:
          'ResponsibilityArea with given responsibilityAreaNr is not connected to any CostPool.',
      });
      return;
    }

    const relationshipExistQuery = `
      MATCH (u:User)-[:BELONGS_TO]->(ra:ResponsibilityArea), (u)-[:BELONGS_TO]->(c:CostPool)
      WHERE u.employeeId = $employeeId AND ra.id = $responsibilityAreaNr AND c.id = $costPoolId
      RETURN u
    `;
    const relationshipExistResult = await session.run(relationshipExistQuery, {
      employeeId,
      responsibilityAreaNr,
      costPoolId,
    });
    if (relationshipExistResult.records.length === 0) {
      res.status(400).json({
        error:
          'No existing relationships found between User, ResponsibilityArea, and CostPool.',
      });
      return;
    }

    const deleteExistingRelationshipsQuery = `
      MATCH (u:User)-[r1:BELONGS_TO]->(ra:ResponsibilityArea), (u)-[r2:BELONGS_TO]->(c:CostPool)
      WHERE u.employeeId = $employeeId AND ra.id = $responsibilityAreaNr AND c.id = $costPoolId
      DELETE r1, r2
    `;
    await session.run(deleteExistingRelationshipsQuery, {
      employeeId,
      responsibilityAreaNr,
      costPoolId,
    });

    res.status(200).json({
      message: `Relationships deleted for User with employeeId '${employeeId}' and ResponsibilityArea with id '${responsibilityAreaNr}', as well as between User and CostPool with id '${costPoolId}'.`,
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      session.close();
    }
  }
};
