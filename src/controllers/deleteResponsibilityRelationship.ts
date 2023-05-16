import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const deleteResponsibilityRelationship = async (
  req: Request,
  res: Response
): Promise<void> => {
  const referensnummer: string | undefined = req.body.referensnummer;

  if (!referensnummer) {
    res.status(400).json({ error: 'Referensnummer is required.' });
    return;
  }

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();
  try {
    // Check if Kvartersvard node exists
    let kvvCount = await session.run(
      'MATCH (k:Kvartersvard) WHERE k.Referensnummer = $referensnummer RETURN count(k)',
      { referensnummer }
    );

    if (kvvCount.records[0].get(0).toNumber() === 0) {
      res.status(400).json({
        error:
          'The node with the provided referensnummer does not exist in the database.',
      });
      return;
    }

    // Delete relationship
    await session.run(
      `MATCH (k:Kvartersvard)-[r:TILLHÖR]->(a:Ansvarsomrade)
       WHERE k.Referensnummer = $referensnummer
       DELETE r`,
      { referensnummer }
    );

    res.status(200).json({
      message: `Relationships for Kvartersvärds node with Referensnummer '${referensnummer}' have been removed.`,
    });
  } catch (error) {
    console.error('Failed to delete responsibility', error);
    res.status(500).json({ error: 'Failed to delete responsibility' });
  } finally {
    session.close();
  }
};

export default deleteResponsibilityRelationship;
