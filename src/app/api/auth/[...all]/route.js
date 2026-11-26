import { auth } from "@/lib/auth"; // Adjust this path to wherever your auth.js file is located
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);