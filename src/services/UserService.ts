import { User, getUsers } from '../controllers/microsoftGraphApi';

import { Driver, Session, Transaction } from 'neo4j-driver';
import connectDB from '../config/db';

interface DBUser {
  id: string;
  displayName: string;
  giveName: string;
  surName: string;
  userPrincipalName: string;
  companyName: string;
  mobilePhone: string;
  officeLocation: string;
  jobTitle: string;
  businessPhones: string[];
  mail: string;
}

async function updateUser(driver: Driver, user: User): Promise<void> {
  const session: Session = driver.session();
  const txc: Transaction = session.beginTransaction();

  try {
    // Update or Create User
    const query: string = `
            MERGE (u:User {id: $id})
            ON CREATE SET u = $props
            ON MATCH SET u += $props
        `;

    await txc.run(query, {
      id: user.id,
      props: user,
    });

    await txc.commit();
  } catch (error) {
    console.error('Failed to write user to database', error);
    await txc.rollback();
  } finally {
    await session.close();
  }
}

export async function updateUsers(): Promise<void> {
  const driver: Driver | undefined = await connectDB();

  if (driver) {
    const users: User[] | null = await getUsers();

    if (users) {
      for (const user of users) {
        await updateUser(driver, user);
      }
    }
  }
}
