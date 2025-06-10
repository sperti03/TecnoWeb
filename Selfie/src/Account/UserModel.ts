export interface User {
  _id: string;
  username: string;
  email: string;
  birthdate: Date;
  password: string;
  profileImage?: {
    data: string;       
    contentType: string; 
  };
}
