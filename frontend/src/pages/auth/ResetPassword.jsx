import { useParams } from "react-router-dom"
import { useState } from "react"
import API from "../../services/api"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import MainLayout from "@/layout/MainLayout"

export default function ResetPassword(){

const { token } = useParams()

const [password,setPassword] = useState("")
const [msg,setMsg] = useState("")

const submit = async ()=>{

const res = await API.post("/auth/reset-password",{
token,
new_password:password
})

setMsg(res.data.message)

}

return(
<MainLayout>
<div className="min-h-screen flex items-center justify-center bg-slate-950">

<Card className="w-[400px] bg-slate-900 border-slate-800">

<CardHeader>

<CardTitle className="text-cyan-400">
Reset Password
</CardTitle>

</CardHeader>

<CardContent className="space-y-4">

<Input className="text-white bg-gray-800 border-gray-700 placeholder-gray-400"
type="password"
placeholder="New password"
onChange={(e)=>setPassword(e.target.value)}
/>

<Button
className="w-full bg-cyan-500 hover:bg-cyan-600"
onClick={submit}
>
Update Password
</Button>

{msg && <p className="text-green-400">{msg}</p>}

</CardContent>

</Card>

</div>
</MainLayout>

)

}