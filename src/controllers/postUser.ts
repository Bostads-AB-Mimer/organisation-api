import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const postUser = async (req: Request, res: Response): Promise<void> => {
  const { namn, referensnummer, telefonnummer, epost } = req.body;
  if (!namn || !referensnummer || !telefonnummer || !epost) {
    res.status(400).json({
      error:
        'All fields (namn, referensnummer, telefonnummer, epost) are required.',
    });
    return;
  }

  const query =
    'CREATE (k:Kvartersvard {Namn: $namn, Referensnummer: $referensnummer, Telefonnummer: $telefonnummer, Epost: $epost})';

  const params = {
    namn: namn,
    referensnummer: referensnummer,
    telefonnummer: telefonnummer,
    epost: epost,
  };

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();
  try {
    await session.run(query, params);
    res.status(201).json({ message: 'User created successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  } finally {
    session.close();
  }
};

export default postUser;
