import { BrowserRouter,Routes,Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Calculator from "./pages/Calculator";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AIEstimation from "./pages/AIEstimation";

import AnalysisReport from "./pages/AnalysisReport"

import About from "./pages/company/About";
import Blog from "./pages/company/Blog";

import Contact from "./pages/company/Contact";

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
path="/dashboard"
element={
<ProtectedRoute>
<Dashboard/>
</ProtectedRoute>
}
/>

<Route path="/report/:projectId" element={<AnalysisReport />} />

<Route path="/about" element={<About />} />
<Route path="/blog" element={<Blog />} />

<Route path="/contact" element={<Contact />} />
<Route path="/ai-estimation" element={<AIEstimation />} />

</Routes>


</BrowserRouter>

)

}

export default App;