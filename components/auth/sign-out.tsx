
"use client"

import { signOut } from "@/lib/auth-client"
 
export default function SignOut() {
  return <button onClick={() => signOut()}>Sign Out</button>
}
    