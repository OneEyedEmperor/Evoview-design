import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Evoview from "./pages/Evoview";

/* "/", "/menu", "/karaoke", "/reservation": the reference (multi-page) navbar.
   "/evoview": the one-page example with sections and trays. */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/evoview" element={<Evoview />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
