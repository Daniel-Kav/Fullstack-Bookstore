import React from 'react'
import ReactDOM from 'react-dom/client'
// import App from './App.tsx'
import BookRepository from './components/BookRepository.tsx'
// import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BookRepository />
  </React.StrictMode>,
)
