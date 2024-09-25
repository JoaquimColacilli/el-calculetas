export interface UserInterface {
  uid: string;
  username: string;
  email: string;
  profilePicture?: string;
  provider?: string;
  idToken?: string;
  password?: string;
}
