import { User, getUsers } from '../controllers/microsoftGraphApi';
import { Driver, Session, Transaction } from 'neo4j-driver';
import connectDB from '../config/db';

interface DBUser extends User {
  employeeId: string;
}

async function updateUser(driver: Driver, user: DBUser): Promise<void> {
  const session: Session = driver.session();
  const txc: Transaction = session.beginTransaction();

  try {
    // Update or Create User node
    const query: string = `
      MERGE (u:User {id: $id})
      ON CREATE SET u = $props
      ON MATCH SET u += $props
    `;
    const { jobTitle, officeLocation, ...userProps } = user;

    await txc.run(query, {
      id: user.id,
      props: userProps,
    });
    console.log(`Updated user in the database: ${JSON.stringify(userProps)}`);

    // Check if JobTitle relationship needs to be updated
    const oldJobTitleQuery: string = `
      MATCH (u:User {id: $id})-[r:WORKS_AS]->(j:JobTitle)
      WHERE j.title <> $jobTitle
      DELETE r
    `;
    await txc.run(oldJobTitleQuery, {
      id: user.id,
      jobTitle: jobTitle || 'Unknown',
    });

    // Update or Create JobTitle node and Relationship
    const jobTitleQuery: string = `
      MERGE (j:JobTitle {title: $jobTitle})
      MERGE (u)-[:WORKS_AS]->(j)
    `;
    await txc.run(jobTitleQuery, {
      id: user.id,
      jobTitle: jobTitle || 'Unknown',
    });
    console.log(`Updated job title in the database: ${jobTitle || 'Unknown'}`);

    // Check if OfficeLocation relationship needs to be updated
    const oldOfficeLocationQuery: string = `
      MATCH (u:User {id: $id})-[r:WORKS_FOR]->(o:OfficeLocation)
      WHERE o.location <> $officeLocation
      DELETE r
    `;
    await txc.run(oldOfficeLocationQuery, {
      id: user.id,
      officeLocation: officeLocation || 'Unknown',
    });

    // Update or Create OfficeLocation node and Relationship
    const officeLocationQuery: string = `
      MERGE (o:OfficeLocation {location: $officeLocation})
      MERGE (u)-[:WORKS_FOR]->(o)
    `;
    await txc.run(officeLocationQuery, {
      id: user.id,
      officeLocation: officeLocation || 'Unknown',
    });
    console.log(
      `Updated office location in the database: ${officeLocation || 'Unknown'}`
    );

    await txc.commit();
  } catch (error) {
    console.error('Failed to write data to database', error);
    await txc.rollback();
  } finally {
    await session.close();
  }
}
export async function updateUsers(): Promise<void> {
  let driver: Driver | undefined;

  try {
    driver = await connectDB();

    if (driver) {
      const users: User[] | null = await getUsers();

      if (users) {
        for (const user of users) {
          if (user.employeeId) {
            await updateUser(driver, user as DBUser);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to update users', error);
  } finally {
    // Attempt to close the driver, handle any errors
    try {
      if (driver) {
        await driver.close();
      }
    } catch (error) {
      console.error('Failed to close driver', error);
    }
  }
}
