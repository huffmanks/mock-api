export type User = EntityField & {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: UserRole;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  company: string;
  department: string;
  jobTitle: string;
  shirtSize: string;
  university: string;
};

export type Product = EntityField & {
  title: string;
  description: string;
  macAddress: string;
  serialNumber: string;
  brand: string;
  deviceOs: string;
  releaseDate: number;
  price: string;
};

export type EntityField = {
  [key: string]: any;
};

export type Entity = "users" | "products";

export type UserRole = "admin" | "manager" | "member" | "guest";
