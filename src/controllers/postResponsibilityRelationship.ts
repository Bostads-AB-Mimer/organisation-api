import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const postResponsibilityRelationship = async (
  req: Request,
  res: Response
): Promise<void> => {
  const referensnummer: string | undefined = req.body.referensnummer;
  const ansvarsomrade: string | undefined = req.body.ansvarsomrade;

  if (!referensnummer || !ansvarsomrade) {
    res
      .status(400)
      .json({ error: 'Both referensnummer and ansvarsomrade are required.' });
    return;
  }

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();
  try {
    const kvvNodeQuery = `MATCH (k:Kvartersvard) WHERE k.Referensnummer = $referensnummer RETURN count(k) as count`;
    const kvvNodeResult = await session.run(kvvNodeQuery, { referensnummer });
    const kvvNodeCount = kvvNodeResult.records[0].get('count').toNumber();
    if (kvvNodeCount === 0) {
      res.status(400).json({
        error:
          'Kvartersvard node with the given referensnummer does not exist in the database.',
      });
      return;
    }

    const ansvarsomradeCountQuery = `MATCH (a:Ansvarsomrade) WHERE a.Ansvarsomrade = $ansvarsomrade RETURN count(a) as count`;
    const ansvarsomradeResult = await session.run(ansvarsomradeCountQuery, {
      ansvarsomrade,
    });
    const ansvarsomradeCount = ansvarsomradeResult.records[0]
      .get('count')
      .toNumber();
    if (ansvarsomradeCount === 0) {
      res.status(400).json({
        error:
          'Ansvarsomrade node with the given ansvarsomrade does not exist in the database.',
      });
      return;
    }

    const createRelationshipQuery = `MATCH (k:Kvartersvard),(a:Ansvarsomrade)
                                     WHERE k.Referensnummer = $referensnummer AND a.Ansvarsomrade = $ansvarsomrade
                                     MERGE (k)-[:TILLHÖR]->(a)`;
    await session.run(createRelationshipQuery, {
      referensnummer,
      ansvarsomrade,
    });
    res.status(200).json({
      message: `Relationship created between Kvartersvärds node with Referensnummer '${referensnummer}' and Ansvarsomrade with Ansvarsomrade '${ansvarsomrade}'.`,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  } finally {
    session.close();
  }
};

export default postResponsibilityRelationship;
