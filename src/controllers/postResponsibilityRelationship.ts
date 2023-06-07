import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const postResponsibilityRelationship = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();
  try {
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

    // Delete existing relationships
    const deleteExistingRelationshipsQuery = `
      MATCH (u:User)-[r:BELONGS_TO]->(:ResponsibilityArea), (u)-[r2:BELONGS_TO]->(:CostPool) 
      WHERE u.employeeId = $employeeId
      DELETE r, r2
    `;
    await session.run(deleteExistingRelationshipsQuery, { employeeId });

    // Create new relationships
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
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  } finally {
    session.close();
  }
};

export default postResponsibilityRelationship;
