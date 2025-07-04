export type User = EntityField & {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  userAgent: string;
  birthDate: string;
  ssn: string;
  role: UserRole;
  gender: string;
  race: string;
  hairColor: string;
  eyeColor: string;
  height: number;
  weight: number;
  image: string;
  shirtSize: string;
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
  slug: string;
  description: string;
  category: "desktop" | "headphone" | "laptop" | "phone" | "speaker" | "tablet" | "tv" | "watch";
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
  releaseDate: string;
  warranty: number | null;
  barcode: string;
  images: {
    landscape: {
      png: string;
      webp: string;
    };
    square: {
      png: string;
      webp: string;
    };
  };
};

export type EntityField = {
  [key: string]: any;
};

export type Entity = "users" | "products";

export type UserRole = "admin" | "manager" | "member" | "guest";
