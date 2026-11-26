import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { organization } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import clientPromise from '@/lib/mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

const db = client.db(process.env.MONGODB_DB || 'marketing_os');

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    // Optional: if you don't provide a client, database transactions won't be enabled.
    client
  }),
   emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      // call your email service (Resend, Nodemailer, etc.)
      await sendEmail({
        to: user.email,
        subject: "Verify your Email",
        html: `Click to verify: <a href="${url}">${url}</a>`,
      });
    },
    sendOnSignUp: true, // auto-send on registration
  },
  emailAndPassword: {
    enabled: true
  },plugins: [organization(), nextCookies()],
  socialProviders: {
    google: {
        clientId:process.env.CLIENT_ID ,
        clientSecret: process.env.CLIENT_SECRET
    }
  },
  user: {
    additionalFields:{
      role: {
        defaultValue: "user"
      },
      plan: {
        defaultValue: "free"
      },
       phone: { type: "string", required: true, input: true },
    address: { type: "string", required: true, input: true }, 
      isBlocked: {
        defaultValue: false
      }
    }
  }
});


