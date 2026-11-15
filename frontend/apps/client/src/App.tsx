import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Homepage } from './components/pages/Homepage';
import './App.css'
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  useEffect(() => {
    document.title = 'Chinese App';
  }, []);

  return (
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      <BrowserRouter>
        <Routes>
          <Route path='/' Component={Homepage} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
