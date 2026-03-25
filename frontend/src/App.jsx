import { BrowserRouter,Routes,Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Calculator from "./pages/Calculator";
import History from "./pages/Dashboard";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";


function App(){

return(

<BrowserRouter>

<Routes>

<Route path="/" element={<Home/>}/>

<Route path="/login" element={<Login/>}/>
<Route path="/register" element={<Register/>}/>
<Route path="/forgot-password" element={<ForgotPassword/>}/>
<Route path="/reset-password/:token" element={<ResetPassword/>}/>


<Route
path="/calculator"
element={
<ProtectedRoute>
<Calculator/>
</ProtectedRoute>
}
/>

<Route
path="/history"
element={
<ProtectedRoute>
<History/>
</ProtectedRoute>
}
/>

</Routes>

</BrowserRouter>

)

}

export default App;