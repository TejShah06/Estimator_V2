import { useState } from "react"
import API from "../../services/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import MainLayout from "@/layout/MainLayout"

export default function ForgotPassword(){

const [email,setEmail] = useState("")
const [msg,setMsg] = useState("")

const submit = async ()=>{

const res = await API.post("/auth/forgot-password",{email})

setMsg(res.data.message)

}

return(
<MainLayout>
<div className="min-h-screen flex items-center justify-center bg-slate-950">

<Card className="w-[400px] bg-slate-900 border-slate-800">

<CardHeader>

<CardTitle className="text-cyan-400">
Forgot Password
</CardTitle>

</CardHeader>

<CardContent className="space-y-4">

<Input className="text-white bg-gray-800 border-gray-700 placeholder-gray-400"
placeholder="Enter your email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<Button
className="w-full bg-cyan-500 hover:bg-cyan-600"
onClick={submit}
>
Send Reset Link
</Button>

{msg && (
<p className="text-green-400 text-sm">
{msg}
</p>
)}

</CardContent>

</Card>

</div>
</MainLayout>

)

}