import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET ?? "change-me"
});

export const config = {
  matcher: ["/dashboard/:path*"]
};