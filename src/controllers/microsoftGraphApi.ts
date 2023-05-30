import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';

// load environment variables
dotenv.config();

// Define the credentials
const credentials = {
  client_id: process.env.MICROSOFT_CLIENTID as string,
  client_secret: process.env.MICROSOFT_SECRETVALUE as string,
  scope: 'https://graph.microsoft.com/.default',
  grant_type: 'client_credentials',
};

// Define the type of user
interface User {
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

// Function to get the access token
export async function getAccessToken(): Promise<string | null> {
  try {
    const url = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANTID}/oauth2/v2.0/token`;

    const response: AxiosResponse = await axios.post(
      url,
      new URLSearchParams(credentials),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (err) {
    console.error('Error getting access token', err);
    return null;
  }
}

// Function to get users data
export async function getUsers(): Promise<User[] | null> {
  try {
    let users: User[] = [];
    let url = `https://graph.microsoft.com/v1.0/users?$select=id,displayName,giveName,surName,userPrincipalName,companyName,mobilePhone,officeLocation,jobTitle,mobilePhone,businessPhones,mail`;

    const token: string | null = await getAccessToken();

    if (token) {
      while (url) {
        const response: AxiosResponse = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Filter out the users that do not have "@mimer.nu" in their email.
        const filteredUsers: User[] = response.data.value.filter((user: User) =>
          user.userPrincipalName.endsWith('@mimer.nu')
        );
        users = users.concat(filteredUsers);

        url = response.data['@odata.nextLink']; // Get the next page if available
      }
    }

    return users;
  } catch (err) {
    console.error('Error getting users', err);
    return null;
  }
}
