import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const deleteResponsibilityRelationship = async (
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

    const deleteRelationshipQuery = `
  MATCH (u:User)-[r:BELONGS_TO]->(ra:ResponsibilityArea)
  WHERE u.employeeId = $employeeId AND ra.id = $responsibilityArea
  OPTIONAL MATCH (u)-[r2:BELONGS_TO]->(c:CostPool)
  DELETE r, r2
`;
    await session.run(deleteRelationshipQuery, {
      employeeId,
      responsibilityArea,
    });
    res.status(200).json({
      message: `Relationship between User with employeeId '${employeeId}' working as Kvartersvärd and ResponsibilityArea with id '${responsibilityArea}' has been removed.`,
    });
  } catch (error) {
    console.error('Failed to delete responsibility', error);
    res.status(500).json({ error: 'Failed to delete responsibility' });
  } finally {
    session.close();
  }
};

export default deleteResponsibilityRelationship;
