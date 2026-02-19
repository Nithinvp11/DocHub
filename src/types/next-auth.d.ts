import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      username?: string | null;
      githubLinked?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
    githubLinked?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username?: string | null;
    githubLinked?: boolean;
  }
}
