import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// NextAuth PrismaAdapter hardcodes `prisma.user` for its user operations.
// We map `.user` to `.participant` so the adapter can find our custom model.
const prismaAdapterCore = prisma as any;
const prismaAdapterClient = {
    ...prismaAdapterCore,
    user: prismaAdapterCore.participant,
};

export const authOptions: NextAuthOptions = {
    // Explicitly pass mapped Prisma adapter
    adapter: PrismaAdapter(prismaAdapterClient) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            // Provide explicit profile mapping to the `Participant` model variables
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    googleId: profile.sub
                }
            }
        }),
        ...(process.env.NODE_ENV === "development" ? [
            CredentialsProvider({
                name: "Development Mock Auth",
                credentials: {
                    email: { label: "Enter any email to mock login", type: "email", placeholder: "test@example.com" }
                },
                async authorize(credentials) {
                    if (!credentials?.email) return null;

                    let dbParticipant = await prisma.participant.findUnique({
                        where: { email: credentials.email }
                    });

                    if (!dbParticipant) {
                        dbParticipant = await prisma.participant.create({
                            data: {
                                email: credentials.email,
                                name: "Mock User - " + credentials.email.split('@')[0],
                            }
                        });
                    }

                    return {
                        id: dbParticipant.id,
                        email: dbParticipant.email,
                        name: dbParticipant.name,
                    };
                }
            })
        ] : [])
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // When user first logs in, stash properties from DB into the token
            if (user) {
                const dbParticipant = await prisma.participant.findUnique({
                    where: { email: user.email! }
                });

                if (dbParticipant) {
                    token.id = dbParticipant.id;
                    token.sysadmin = dbParticipant.sysadmin;
                    token.keyholder = dbParticipant.keyholder;
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Attach JWT custom params to the client-facing session
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).sysadmin = token.sysadmin;
                (session.user as any).keyholder = token.keyholder;
            }
            return session;
        }
    }
}

const handler = NextAuth(authOptions);

// Export for App Router API routes
export { handler as GET, handler as POST };
