export type User = EntityField & {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  userAgent: string;
  birthDate: string;
  ssn: string;
  gender: string;
  role: UserRole;
  shirtSize: string;
  hairColor: string;
  eyeColor: string;
  height: number;
  weight: number;
  race: string;
  university: string;
  creditCard: {
    number: string;
    type: string;
    expire: string;
    cvv: number;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  job: {
    company: string;
    department: string;
    title: string;
  };
};

export type Product = EntityField & {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  brand: string;
  sku: string;
  macAddress: string;
  serialNumber: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  releaseDate: number;
  warranty: string;
  barcode: string;
  image: string;
};

export type EntityField = {
  [key: string]: any;
};

export type Entity = "users" | "products";

export type UserRole = "admin" | "manager" | "member" | "guest";
