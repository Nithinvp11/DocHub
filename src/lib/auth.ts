import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Full GitHub OAuth scopes for comprehensive integration
const GITHUB_SCOPES = [
  'repo', // Full repo access (read/write)
  'read:org', // Read organization membership
  'read:user', // Read user profile
  'user:email', // Access user email
  'workflow', // Manage GitHub Actions workflows
  'write:discussion', // Create/edit discussions
].join(' ');

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: GITHUB_SCOPES,
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth',
    signOut: '/',
    error: '/auth/error',
  },
  events: {
    async signOut() {
      // Custom logic after sign out if needed
      console.log('User signed out');
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if this is a GitHub OAuth callback for account linking
      if (account?.provider === 'github' && profile) {
        try {
          const githubProfile = profile as {
            id: number;
            login: string;
            avatar_url: string;
            html_url: string;
            email?: string;
          };

          // Check if user already exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            // Update existing user to link GitHub account
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                githubLinked: true,
                githubUserId: githubProfile.id,
                githubUsername: githubProfile.login,
                githubAvatarUrl: githubProfile.avatar_url,
                githubProfileUrl: githubProfile.html_url,
                githubEmail: githubProfile.email || user.email,
                githubTokenScopes: account.scope?.split(' ') || [],
                githubTokenExpiresAt: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
              },
            });

            // Store GitHub token for workspaces
            if (account.access_token) {
              const userWorkspaces = await prisma.workspaceMember.findMany({
                where: { userId: existingUser.id },
                select: { workspaceId: true },
              });

              for (const workspace of userWorkspaces) {
                await prisma.gitHubAuth.upsert({
                  where: {
                    userId_workspaceId: {
                      userId: existingUser.id,
                      workspaceId: workspace.workspaceId,
                    },
                  },
                  create: {
                    userId: existingUser.id,
                    workspaceId: workspace.workspaceId,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token || null,
                    expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                  },
                  update: {
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token || null,
                    expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                  },
                });
              }
            }
          } else {
            // New user via GitHub OAuth
            await prisma.user.update({
              where: { id: user.id },
              data: {
                githubLinked: true,
                githubUserId: githubProfile.id,
                githubUsername: githubProfile.login,
                githubAvatarUrl: githubProfile.avatar_url,
                githubProfileUrl: githubProfile.html_url,
                githubEmail: githubProfile.email || user.email,
                githubTokenScopes: account.scope?.split(' ') || [],
                githubTokenExpiresAt: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
              },
            });
          }
        } catch (error) {
          console.error('Error storing GitHub profile:', error);
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      if (account?.provider === 'github' && account.access_token) {
        // Store or update GitHub access token
        try {
          await prisma.user.update({
            where: { id: token.id as string },
            data: {
              githubLinked: true,
              githubTokenScopes: account.scope?.split(' ') || [],
              githubTokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            },
          });

          // Create GitHubAuth records for all user's workspaces
          const userWorkspaces = await prisma.workspaceMember.findMany({
            where: { userId: token.id as string },
            select: { workspaceId: true },
          });

          for (const workspace of userWorkspaces) {
            await prisma.gitHubAuth.upsert({
              where: {
                userId_workspaceId: {
                  userId: token.id as string,
                  workspaceId: workspace.workspaceId,
                },
              },
              create: {
                userId: token.id as string,
                workspaceId: workspace.workspaceId,
                accessToken: account.access_token,
                refreshToken: account.refresh_token || null,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
              },
              update: {
                accessToken: account.access_token,
                refreshToken: account.refresh_token || null,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
              },
            });
          }

          console.log(`GitHub auth created for ${userWorkspaces.length} workspaces`);
        } catch (error) {
          console.error('Error updating GitHub auth:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
