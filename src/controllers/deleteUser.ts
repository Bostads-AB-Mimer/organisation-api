import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const referensnummer: string | undefined = req.params.referensnummer;

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
    // Check if user exists
    const userExists = await session.run(
      `MATCH (k:Kvartersvard) WHERE k.Referensnummer = $referensnummer RETURN k`,
      { referensnummer }
    );

    if (userExists.records.length === 0) {
      res.status(404).json({ error: 'No such user found.' });
      return;
    }

    // Delete user
    await session.run(
      `MATCH (k:Kvartersvard) WHERE k.Referensnummer = $referensnummer DETACH DELETE k`,
      { referensnummer }
    );

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    session.close();
  }
};

export default deleteUser;
