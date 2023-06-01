import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const postResponsibilityRelationship = async (
  req: Request,
  res: Response
): Promise<void> => {
  const employeeId: string | undefined = req.body.employeeId;
  const responsibilityArea: string | undefined = req.body.responsibilityArea;

  if (!employeeId || !responsibilityArea) {
    res
      .status(400)
      .json({ error: 'Both employeeId and responsibilityArea are required.' });
    return;
  }

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();
  try {
    const userNodeQuery = `MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE u.employeeId = $employeeId AND j.title="Kvartersvärd" RETURN count(u) as count`;
    const userNodeResult = await session.run(userNodeQuery, { employeeId });
    const userNodeCount = userNodeResult.records[0].get('count').toNumber();
    if (userNodeCount === 0) {
      res.status(400).json({
        error:
          'User node with the given employeeId and working as Kvartersvärd does not exist in the database.',
      });
      return;
    }

    const responsibilityAreaCountQuery = `MATCH (ra:ResponsibilityArea) WHERE ra.id = $responsibilityArea RETURN count(ra) as count`;
    const responsibilityAreaResult = await session.run(
      responsibilityAreaCountQuery,
      {
        responsibilityArea,
      }
    );
    const responsibilityAreaCount = responsibilityAreaResult.records[0]
      .get('count')
      .toNumber();
    if (responsibilityAreaCount === 0) {
      res.status(400).json({
        error:
          'ResponsibilityArea node with the given id does not exist in the database.',
      });
      return;
    }

    const createRelationshipQuery = `MATCH (u:User)-[:WORKS_AS]->(j:JobTitle),(ra:ResponsibilityArea)
                                     WHERE u.employeeId = $employeeId AND j.title="Kvartersvärd" AND ra.id = $responsibilityArea
                                     MERGE (u)-[:BELONGS_TO]->(ra)`;
    await session.run(createRelationshipQuery, {
      employeeId,
      responsibilityArea,
    });
    res.status(200).json({
      message: `Relationship created between User with employeeId '${employeeId}' working as Kvartersvärd and ResponsibilityArea with id '${responsibilityArea}'.`,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  } finally {
    session.close();
  }
};

export default postResponsibilityRelationship;
