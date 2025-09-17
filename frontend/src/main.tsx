import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/debugHelpers' // Add debug helpers

createRoot(document.getElementById("root")!).render(<App />);
